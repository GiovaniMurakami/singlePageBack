import { UsuarioDynamoRepositorio } from "../infra/dynamodb/repositorios/usuarioDynamoRepositorio";
import { PaginaDynamoRepositorio } from "../infra/dynamodb/repositorios/paginaDynamoRepositorio";
import { RefreshTokenDynamoRepositorio } from "../infra/dynamodb/repositorios/refreshTokenDynamoRepositorio";
import { TokenBlacklistDynamoRepositorio } from "../infra/dynamodb/repositorios/tokenBlacklistDynamoRepositorio";

export function criarRepositorios() {
  return {
    usuario: UsuarioDynamoRepositorio.criar(),
    pagina: PaginaDynamoRepositorio.criar(),
    refreshToken: RefreshTokenDynamoRepositorio.criar(),
    tokenBlacklist: TokenBlacklistDynamoRepositorio.criar(),
  };
}

export type Repositorios = ReturnType<typeof criarRepositorios>;
