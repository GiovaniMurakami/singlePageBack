import { UsuarioDynamoRepositorio } from "../infra/dynamodb/repositorios/usuarioDynamoRepositorio";
import { PaginaDynamoRepositorio } from "../infra/dynamodb/repositorios/paginaDynamoRepositorio";
import { RefreshTokenDynamoRepositorio } from "../infra/dynamodb/repositorios/refreshTokenDynamoRepositorio";
import { TokenBlacklistDynamoRepositorio } from "../infra/dynamodb/repositorios/tokenBlacklistDynamoRepositorio";
import { AnalyticsDynamoRepositorio } from "../infra/dynamodb/repositorios/analyticsDynamoRepositorio";
import { ComunidadeDynamoRepositorio } from "../infra/dynamodb/repositorios/comunidadeDynamoRepositorio";

export function criarRepositorios() {
  return {
    usuario: UsuarioDynamoRepositorio.criar(),
    pagina: PaginaDynamoRepositorio.criar(),
    refreshToken: RefreshTokenDynamoRepositorio.criar(),
    tokenBlacklist: TokenBlacklistDynamoRepositorio.criar(),
    analytics: AnalyticsDynamoRepositorio.criar(),
    comunidade: ComunidadeDynamoRepositorio.criar(),
  };
}

export type Repositorios = ReturnType<typeof criarRepositorios>;
