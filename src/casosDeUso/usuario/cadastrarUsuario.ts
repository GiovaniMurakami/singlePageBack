import bcrypt from "bcryptjs";
import { Usuario } from "../../dominio/entidade/usuario";
import { EmailUsuarioJaExisteErro, UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { RefreshTokenGateway } from "../../dominio/gateway/refreshTokenGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { emitirSessao } from "./emitirSessao";

export type CadastrarUsuarioInputDto = {
  nome: string;
  email: string;
  senha: string;
};

export class CadastrarUsuario implements CasoDeUso<CadastrarUsuarioInputDto, Awaited<ReturnType<typeof emitirSessao>>> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly refreshTokenGateway: RefreshTokenGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, refreshTokenGateway: RefreshTokenGateway) {
    return new CadastrarUsuario(usuarioGateway, refreshTokenGateway);
  }

  public async executar(input: CadastrarUsuarioInputDto) {
    const email = input.email.trim().toLowerCase();
    const existente = await this.usuarioGateway.buscarPorEmail(email);
    if (existente) {
      throw ErroPersonalizado.criar({
        mensagem: "Não foi possível concluir o cadastro.",
        status: StatusErro.erroParametro,
      });
    }

    const usuario = Usuario.criar({
      nome: input.nome,
      email,
      senha: await bcrypt.hash(input.senha, 12),
    });

    try {
      await this.usuarioGateway.salvar(usuario);
    } catch (error) {
      if (error instanceof EmailUsuarioJaExisteErro) {
        throw ErroPersonalizado.criar({
          mensagem: "Não foi possível concluir o cadastro.",
          status: StatusErro.erroParametro,
        });
      }
      throw error;
    }

    return emitirSessao(usuario, this.refreshTokenGateway);
  }
}
