import "./carregarEnv";
import Stripe from "stripe";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

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
    descricao: "Até 50 páginas e domínio personalizável. Cobrança anual.",
    valorCentavos: 4990,
    interval: "year" as const,
  },
] as const;

function atualizarEnv(valores: Record<string, string>) {
  const caminho = resolve(process.cwd(), ".env");
  let conteudo = "";
  try {
    conteudo = readFileSync(caminho, "utf8");
  } catch {
    conteudo = "";
  }

  for (const [chave, valor] of Object.entries(valores)) {
    const linha = `${chave}=${valor}`;
    const regex = new RegExp(`^${chave}=.*$`, "m");
    if (regex.test(conteudo)) {
      conteudo = conteudo.replace(regex, linha);
    } else {
      conteudo = `${conteudo.trimEnd()}\n${linha}\n`;
    }
  }

  writeFileSync(caminho, conteudo.endsWith("\n") ? conteudo : `${conteudo}\n`);
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Defina STRIPE_SECRET_KEY no .env (Dashboard Stripe > Desenvolvedores > Chaves de API). Use a chave de teste sk_test_...");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const gravados: Record<string, string> = {};

  for (const plano of PLANOS) {
    const produto = await stripe.products.create({
      name: plano.nome,
      description: plano.descricao,
    });
    const preco = await stripe.prices.create({
      product: produto.id,
      unit_amount: plano.valorCentavos,
      currency: "brl",
      recurring: { interval: plano.interval },
    });
    gravados[plano.env] = preco.id;
    console.log(`${plano.nome}: produto ${produto.id} · preço ${preco.id} (${plano.interval})`);
  }

  atualizarEnv(gravados);
  console.log("IDs gravados no .env. Atualize também .env.homolog / .env.production e faça redeploy.");
  console.log("Próximo passo: webhook apontando para /assinatura/webhook.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
