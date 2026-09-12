# AI Context — single-page-back

API Node.js + TypeScript para o construtor de páginas únicas **Single**.

**Frontend pareado:** `singlePage` (React 19 + Vite 7 + Tailwind 4).

## Stack

- Express 4 + serverless-http (uma Lambda)
- DynamoDB single-table (`pk`/`sk`, payload JSON)
- JWT (RS256 em prod via SSM/Base64; HS256 só local)
- Stripe (checkout, portal, webhook)
- S3 presigned upload
- Zod + Jest

## Arquitetura

Clean Architecture + DDD, composição manual:

`app.ts` → repositórios → serviços → casos de uso → rotas Express.

Padrão: entidade, gateway, `Caso.criar(deps).executar(input)`, rota `*Rota`.

## Endpoints

```
POST /usuario/cadastrar, /login, /refresh-token, /logout
GET  /usuario/perfil
POST /pagina
GET  /pagina, /pagina/:id
PUT  /pagina/:id
POST /pagina/:id/publicar
DELETE /pagina/:id
GET  /p/:slug
GET  /assinatura/planos
POST /assinatura/checkout, /portal, /webhook
POST /imagem/upload-url
GET  /health
```

## Planos

- free: 1 página, marca Single
- pro: 10 páginas, sem marca
- ultra: 50 páginas, domínio próprio (flag)

## Deploy

`npm run deploy:dev` / `deploy:prod` — Serverless Framework, conta AWS do usuário.
