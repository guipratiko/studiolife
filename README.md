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

## Vídeo do banner (iOS / Android)

- O `server.js` envia **`Accept-Ranges: bytes`** e responde a **`Range`** com **206 Partial Content**. Sem isso, muitos celulares (principalmente **Safari no iOS**) não reproduzem MP4 corretamente.
- O arquivo **`banner.mp4`** deve ser **H.264 (vídeo) + AAC (áudio)** em container `.mp4`. Vídeos só em **HEVC/H.265** ou codecs exóticos podem falhar no iPhone.
- Se ainda não tocar, reexporte com HandBrake/FFmpeg em **H.264** e faça novo deploy.
