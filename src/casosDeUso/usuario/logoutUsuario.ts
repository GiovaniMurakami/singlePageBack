import { RefreshTokenGateway } from "../../dominio/gateway/refreshTokenGateway";
import { TokenBlacklistGateway } from "../../dominio/gateway/tokenBlacklistGateway";
import { CasoDeUso } from "../casoDeUso";
import { decodificarExpiracao } from "../../helpers/jwt";

export type LogoutUsuarioInputDto = {
  accessToken: string;
  refreshToken?: string;
  usuarioId: string;
};

export class LogoutUsuario implements CasoDeUso<LogoutUsuarioInputDto, { ok: true }> {
  private constructor(
    private readonly refreshTokenGateway: RefreshTokenGateway,
    private readonly tokenBlacklistGateway: TokenBlacklistGateway
  ) {}

  public static criar(
    refreshTokenGateway: RefreshTokenGateway,
    tokenBlacklistGateway: TokenBlacklistGateway
  ) {
    return new LogoutUsuario(refreshTokenGateway, tokenBlacklistGateway);
  }

  public async executar(input: LogoutUsuarioInputDto) {
    const expiresAt = decodificarExpiracao(input.accessToken) ?? new Date(Date.now() + 30 * 60 * 1000);
    await this.tokenBlacklistGateway.adicionar(input.accessToken, expiresAt);

    if (input.refreshToken) {
      await this.refreshTokenGateway.consumir(input.refreshToken);
    } else {
      await this.refreshTokenGateway.excluirPorUsuario(input.usuarioId);
    }

    return { ok: true as const };
  }
}
