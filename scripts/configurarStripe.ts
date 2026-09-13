import dotenv from "dotenv";
import Stripe from "stripe";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

for (const arquivo of [".env.production", ".env.prod", ".env"]) {
  dotenv.config({ path: resolve(process.cwd(), arquivo) });
}

const PLANOS = [
  {
    env: "STRIPE_PRICE_PRO",
    nome: "Single Pro",
    descricao: "Até 10 páginas no domínio singlepage.com.br, sem marca Single. Cobrança mensal.",
    valorCentavos: 990,
    interval: "month" as const,
  },
  {
    env: "STRIPE_PRICE_ULTRA",
    nome: "Single Ultra",
    descricao: "Até 50 páginas e domínio personalizável. Cobrança mensal.",
    valorCentavos: 4990,
    interval: "month" as const,
  },
] as const;

const ARQUIVOS_ENV = [".env", ".env.prod", ".env.production"];

function atualizarEnv(valores: Record<string, string>) {
  for (const arquivo of ARQUIVOS_ENV) {
    const caminho = resolve(process.cwd(), arquivo);
    if (!existsSync(caminho)) continue;

    let conteudo = readFileSync(caminho, "utf8");
    for (const [chave, valor] of Object.entries(valores)) {
      const linha = `${chave}=${valor}`;
      const regex = new RegExp(`^${chave}=.*$`, "gm");
      if (regex.test(conteudo)) {
        conteudo = conteudo.replace(regex, linha);
      } else {
        conteudo = `${conteudo.trimEnd()}\n${linha}\n`;
      }
    }

    writeFileSync(caminho, conteudo.endsWith("\n") ? conteudo : `${conteudo}\n`);
    console.log(`IDs gravados em ${arquivo}`);
  }
}

function produtoId(preco: Stripe.Price): string {
  return typeof preco.product === "string" ? preco.product : preco.product.id;
}

async function obterProduto(stripe: Stripe, plano: (typeof PLANOS)[number], priceId?: string) {
  if (priceId) {
    try {
      const preco = await stripe.prices.retrieve(priceId);
      return produtoId(preco);
    } catch {
      // preço antigo sumiu; cai no lookup por nome
    }
  }

  const produtos = await stripe.products.list({ limit: 100, active: true });
  const existente = produtos.data.find((produto) => produto.name === plano.nome);
  if (existente) return existente.id;

  const criado = await stripe.products.create({
    name: plano.nome,
    description: plano.descricao,
  });
  console.log(`${plano.nome}: produto criado ${criado.id}`);
  return criado.id;
}

function precoBate(preco: Stripe.Price, plano: (typeof PLANOS)[number]) {
  return (
    preco.active &&
    preco.unit_amount === plano.valorCentavos &&
    preco.currency === "brl" &&
    preco.recurring?.interval === plano.interval
  );
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Defina STRIPE_SECRET_KEY em .env.production.");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const gravados: Record<string, string> = {};

  for (const plano of PLANOS) {
    const atualId = process.env[plano.env] || "";
    if (atualId) {
      try {
        const atual = await stripe.prices.retrieve(atualId);
        console.log(
          `${plano.nome}: atual ${atual.id} · ${atual.unit_amount} ${atual.currency}/${atual.recurring?.interval || "avulso"} · active=${atual.active}`
        );
        if (precoBate(atual, plano)) {
          gravados[plano.env] = atual.id;
          console.log(`${plano.nome}: já está em R$ ${(plano.valorCentavos / 100).toFixed(2)}/${plano.interval}`);
          continue;
        }
      } catch {
        console.log(`${plano.nome}: price id atual não encontrado, criando outro`);
      }
    }

    const product = await obterProduto(stripe, plano, atualId || undefined);
    await stripe.products.update(product, { description: plano.descricao });

    const existentes = await stripe.prices.list({ product, active: true, limit: 20 });
    const reuso = existentes.data.find((preco) => precoBate(preco, plano));
    if (reuso) {
      gravados[plano.env] = reuso.id;
      console.log(`${plano.nome}: reusou ${reuso.id}`);
      continue;
    }

    const preco = await stripe.prices.create({
      product,
      unit_amount: plano.valorCentavos,
      currency: "brl",
      recurring: { interval: plano.interval },
    });
    gravados[plano.env] = preco.id;
    console.log(`${plano.nome}: novo preço ${preco.id} (${plano.valorCentavos} ${plano.interval})`);

    if (atualId && atualId !== preco.id) {
      try {
        await stripe.prices.update(atualId, { active: false });
        console.log(`${plano.nome}: desativou preço antigo`);
      } catch {
        console.log(`${plano.nome}: não desativou o preço antigo`);
      }
    }
  }

  atualizarEnv(gravados);
  console.log("Próximo passo: redeploy da API para o checkout usar os novos IDs.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
