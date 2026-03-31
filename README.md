# Studio Life — site estático

## Deploy no EasyPanel / Nixpacks

1. **Raiz do repositório**  
   Não use a subpasta `img` como diretório do app. O build precisa da raiz, onde estão `index.html`, `package.json` e a pasta `img/`.

2. **Arquivo principal**  
   A página inicial é **`index.html`** (cópia do template). Os assets usam caminhos relativos (`img/...`).

3. **Nixpacks**  
   O `package.json` roda `node server.js`, servindo arquivos estáticos da raiz. A porta vem da variável `PORT` do painel (padrão 3000).

## Desenvolvimento local

```bash
npm start
```

Abra `http://localhost:3000`.

## Formulário e webhook (CORS)

O navegador **não pode** chamar `https://back.onlyflow.com.br/...` via JavaScript de outro domínio sem permissão CORS — o OnlyFlow responde com erro nesse caso.

Por isso o site envia `POST` para **`/api/contato`** no **mesmo servidor** (`server.js`), que **repassa** o corpo ao webhook (sem CORS no navegador).

Variável opcional:

- `ONLYFLOW_WEBHOOK_URL` — URL completa do webhook (padrão é a do projeto).

## Vídeo do banner (iOS / Android)

- O `server.js` envia **`Accept-Ranges: bytes`** e responde a **`Range`** com **206 Partial Content**. Sem isso, muitos celulares (principalmente **Safari no iOS**) não reproduzem MP4 corretamente.
- O arquivo **`banner.mp4`** deve ser **H.264 (vídeo) + AAC (áudio)** em container `.mp4`. Vídeos só em **HEVC/H.265** ou codecs exóticos podem falhar no iPhone.
- Se ainda não tocar, reexporte com HandBrake/FFmpeg em **H.264** e faça novo deploy.
