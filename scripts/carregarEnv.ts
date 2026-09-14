import dotenv from "dotenv";
import { resolve } from "path";

const raiz = process.cwd();
const ambiente = process.env.APP_ENV || process.env.NODE_ENV || "development";
if (ambiente === "homolog" || ambiente === "dev") {
  dotenv.config({ path: resolve(raiz, ".env.homolog") });
} else {
  dotenv.config({ path: resolve(raiz, ".env") });
  dotenv.config({ path: resolve(raiz, ".env.local"), override: true });
}
