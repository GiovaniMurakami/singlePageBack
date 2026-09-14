import dotenv from "dotenv";
import { resolve } from "path";

/**
 * Local: `.env` (base) + `.env.local` (opcional, sobrescreve).
 * Homolog/scripts: `APP_ENV=homolog` carrega `.env.homolog`.
 * Produção Lambda: variáveis já vêm do runtime — não carrega arquivo.
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const raiz = process.cwd();
  const ambiente = process.env.APP_ENV || process.env.NODE_ENV || "development";
  if (ambiente === "homolog" || ambiente === "dev") {
    dotenv.config({ path: resolve(raiz, ".env.homolog") });
  } else {
    dotenv.config({ path: resolve(raiz, ".env") });
    dotenv.config({ path: resolve(raiz, ".env.local"), override: true });
  }
}
