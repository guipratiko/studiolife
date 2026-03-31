/**
 * Servidor estático + proxy do formulário (evita CORS no navegador).
 * Vídeos MP4: suporte a Range (bytes) para iOS/Android.
 */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const WEBHOOK_URL =
  process.env.ONLYFLOW_WEBHOOK_URL ||
  "https://back.onlyflow.com.br/api/workflows/webhook/webhookTrigger-1774974204321";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
};

function readRequestBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function proxyWebhook(bodyBuffer, contentType) {
  return new Promise((resolve, reject) => {
    const target = new URL(WEBHOOK_URL);
    const opts = {
      hostname: target.hostname,
      port: 443,
      path: target.pathname + target.search,
      method: "POST",
      headers: {
        "Content-Type": contentType || "application/x-www-form-urlencoded; charset=UTF-8",
        "Content-Length": bodyBuffer.length,
        "User-Agent": "StudioLife-site-proxy/1.0",
      },
    };

    const reqOut = https.request(opts, (resIn) => {
      const chunks = [];
      resIn.on("data", (c) => chunks.push(c));
      resIn.on("end", () => {
        resolve({
          status: resIn.statusCode || 502,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    reqOut.on("error", reject);
    reqOut.write(bodyBuffer);
    reqOut.end();
  });
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let rel = decoded.replace(/^\/+/, "");
  if (rel === "" || rel.endsWith("/")) rel = path.join(rel, "index.html");
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

function sendFileWithRange(req, res, filePath, ext) {
  const contentType = MIME[ext] || "application/octet-stream";

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const size = stat.size;
    const range = req.headers.range;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        res.writeHead(416);
        res.end();
        return;
      }
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
        res.writeHead(416, { "Content-Range": `bytes */${size}` });
        res.end();
        return;
      }
      end = Math.min(end, size - 1);
      const chunk = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunk,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Length": size,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    });

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = (req.url || "").split("?")[0];

  if (req.method === "POST" && (pathname === "/api/contato" || pathname === "/api/contato/")) {
    try {
      const ct =
        req.headers["content-type"] || "application/x-www-form-urlencoded; charset=UTF-8";
      const body = await readRequestBody(req);
      const out = await proxyWebhook(body, ct);

      if (out.status >= 200 && out.status < 300) {
        res.writeHead(303, { Location: "/?enviado=1#contato" });
        res.end();
        return;
      }

      console.error("[webhook]", out.status, out.body.slice(0, 500));
      res.writeHead(303, { Location: "/?enviado=erro#contato" });
      res.end();
    } catch (e) {
      console.error("[contato]", e);
      res.writeHead(303, { Location: "/?enviado=erro#contato" });
      res.end();
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }

  const filePath = safePath(req.url === "/" ? "/index.html" : req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    if (req.method === "HEAD") {
      fs.stat(filePath, (e, st) => {
        if (e) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          "Content-Length": st.size,
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Accept-Ranges": "bytes",
        });
        res.end();
      });
      return;
    }

    sendFileWithRange(req, res, filePath, ext);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`http://0.0.0.0:${PORT} — static + POST /api/contato → webhook`);
});
