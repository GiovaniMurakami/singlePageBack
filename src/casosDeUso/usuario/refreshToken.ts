import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { RefreshTokenGateway } from "../../dominio/gateway/refreshTokenGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { emitirSessao } from "./emitirSessao";

export type RefreshTokenInputDto = {
  refreshToken: string;
};

export class RefreshToken implements CasoDeUso<RefreshTokenInputDto, Awaited<ReturnType<typeof emitirSessao>>> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly refreshTokenGateway: RefreshTokenGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, refreshTokenGateway: RefreshTokenGateway) {
    return new RefreshToken(usuarioGateway, refreshTokenGateway);
  }

  public async executar(input: RefreshTokenInputDto) {
    const dados = await this.refreshTokenGateway.consumir(input.refreshToken);
    if (!dados) {
      throw ErroPersonalizado.criar({
        mensagem: "Refresh token inválido ou expirado.",
        status: StatusErro.erroNaoAutorizado,
      });
    }

    const usuario = await this.usuarioGateway.buscarPorId(dados.usuarioId);
    if (!usuario) {
      throw ErroPersonalizado.criar({
        mensagem: "Sessão inválida.",
        status: StatusErro.erroNaoAutorizado,
      });
    }

    return emitirSessao(usuario, this.refreshTokenGateway);
  }
}
