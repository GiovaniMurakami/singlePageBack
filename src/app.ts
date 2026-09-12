import "./configurarAmbiente";
import { ApiExpress } from "./infra/api/express/api.express";
import { inicializarAutenticarJwt } from "./middlewares/express/autenticarJwt";
import { criarRepositorios } from "./composicao/repositorios";
import { criarServicos } from "./composicao/servicos";
import { criarCasosDeUso } from "./composicao/casos";
import { criarRotas } from "./composicao/rotas";
import { assertJwtConfig } from "./helpers/jwt";

export function app() {
  if (!process.env.DYNAMODB_DATA_TABLE) {
    throw new Error("Variável de ambiente obrigatória não definida: DYNAMODB_DATA_TABLE");
  }
  assertJwtConfig();

  const repos = criarRepositorios();
  const servicos = criarServicos();
  const casos = criarCasosDeUso(repos, servicos);
  const rotas = criarRotas(casos);

  inicializarAutenticarJwt(repos.tokenBlacklist);
  return ApiExpress.criar(rotas).retornarAplicacao();
}
