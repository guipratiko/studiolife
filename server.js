/**
 * Servidor estático mínimo (sem dependências) para Nixpacks / EasyPanel.
 * Respeita PORT quando definido pelo host.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

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
  ".woff2": "font/woff2",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let rel = decoded.replace(/^\/+/, "");
  if (rel === "" || rel.endsWith("/")) rel = path.join(rel, "index.html");
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const filePath = safePath(req.url === "/" ? "/index.html" : req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Static server at http://0.0.0.0:${PORT}`);
});
