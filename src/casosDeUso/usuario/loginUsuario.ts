import bcrypt from "bcryptjs";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { RefreshTokenGateway } from "../../dominio/gateway/refreshTokenGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { emitirSessao } from "./emitirSessao";

export type LoginUsuarioInputDto = {
  email: string;
  senha: string;
};

export class LoginUsuario implements CasoDeUso<LoginUsuarioInputDto, Awaited<ReturnType<typeof emitirSessao>>> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly refreshTokenGateway: RefreshTokenGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, refreshTokenGateway: RefreshTokenGateway) {
    return new LoginUsuario(usuarioGateway, refreshTokenGateway);
  }

  public async executar(input: LoginUsuarioInputDto) {
    const usuario = await this.usuarioGateway.buscarPorEmail(input.email.trim().toLowerCase());
    const senhaOk = usuario ? await bcrypt.compare(input.senha, usuario.senha) : false;

    if (!usuario || !senhaOk) {
      throw ErroPersonalizado.criar({
        mensagem: "E-mail ou senha inválidos.",
        status: StatusErro.erroNaoAutorizado,
      });
    }

    return emitirSessao(usuario, this.refreshTokenGateway);
  }
}
