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
