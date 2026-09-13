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
POST /suporte
POST /usuario/verificar-email, /reenviar-verificacao, /esqueci-senha, /redefinir-senha, /alterar-senha
POST /p/:slug/formulario
GET  /health
```

`GET /health` → 200. `HEAD /health` no API Gateway custom domain devolve 403 `MissingAuthenticationToken` — ignorar.

## Planos

- free: 1 página, marca Single, anúncios na publicada
- pro: 10 páginas, sem marca, sem anúncios — **R$ 9,90/mês**
- ultra: 50 páginas, domínio próprio — **R$ 49,90/mês**

`planoEfetivo()`: Pro/Ultra vale a menos que `statusAssinatura === "cancelada"`. Não exigir `ativa`/`trial` — senão upgrade no banco sem webhook continua Free.

Página pública (`GET /p/:slug`) lê o dono e devolve `anuncios` / `marca` pelos limites do plano efetivo.

## Fluxo para production (obrigatório)

Nunca mandar commit direto em `production`. Sempre:

1. Branch de fix/feature.
2. Merge em **`homolog`** e `git push origin homolog`.
3. Gerar **GitHub Release** (`gh release create vX.Y.Z --target homolog`).
4. Merge de `homolog` em **`production`** e `git push origin production`.
5. Publicar API: `npm run deploy:dev` (homolog / stage `dev`) e `npm run deploy:prod` (production / stage `prod`). Os scripts **não** se chamam `deploy:production`.

Stages Serverless: `dev` → `yvauyxdyic` / `https://api.homolog.singlepage.com.br`  
`prod` → `mao94ci2z8` / `https://api.singlepage.com.br`

Tabelas: `single-page-dev-data` / `single-page-prod-data`.

## Stripe

- Preço Stripe é imutável: criar preço novo, desativar o antigo, atualizar `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ULTRA`.
- `npm run stripe:setup` reusa produto existente; não cria produto duplicado.
- Live key só em `.env.production` (localmente pode existir symlink `.env.prod`). **Nunca commitar** `.env.production` nem dump de secret.
- Homolog não deve usar chave live. `stripe:setup` carrega `.env.production` / `.env.prod` / `.env`.

## E-mail (SES)

From: `Single <noreply@singlepage.com.br>` (identidade do domínio no SES). Ajuda vai para `EMAIL_SUPORTE` (`giovani.murakami@outlook.com`).
Contas novas recebem link de verificação. Troca/reset de senha, plano alterado, página publicada e envio de formulário também saem por SES.

## Decisões desta sessão

- Conta `giovani.murakami@outlook.com` estava `plano: free` + `statusAssinatura: nenhuma` e **sem** `stripeCustomerId` — o checkout/webhook não gravou. Ajuste manual no Dynamo (prod e dev) para `pro` + `ativa` para as páginas publicadas saírem sem anúncio.
- Certificado ACM da API já ISSUED; não re-pedir. Zona Route53 `Z07860201ZNKLGBC7DFRA`.
- `useDotenv` no Serverless: stage `prod` lê `.env.prod`.
