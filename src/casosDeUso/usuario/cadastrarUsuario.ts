import bcrypt from "bcryptjs";
import { Usuario } from "../../dominio/entidade/usuario";
import { EmailUsuarioJaExisteErro, UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { RefreshTokenGateway } from "../../dominio/gateway/refreshTokenGateway";
import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { emitirSessao } from "./emitirSessao";
import { dispararVerificacaoEmail } from "./verificarEmail";
import { VERSAO_TERMOS } from "../../helpers/termos";

export type CadastrarUsuarioInputDto = {
  nome: string;
  email: string;
  senha: string;
  aceiteTermos: boolean;
};

export class CadastrarUsuario implements CasoDeUso<CadastrarUsuarioInputDto, Awaited<ReturnType<typeof emitirSessao>>> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly refreshTokenGateway: RefreshTokenGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, refreshTokenGateway: RefreshTokenGateway, email: EmailGateway) {
    return new CadastrarUsuario(usuarioGateway, refreshTokenGateway, email);
  }

  public async executar(input: CadastrarUsuarioInputDto) {
    if (!input.aceiteTermos) {
      throw ErroPersonalizado.criar({
        mensagem: "Aceite os Termos de Uso e a Política de Privacidade.",
        status: StatusErro.erroParametro,
      });
    }

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
      aceiteTermosEm: new Date(),
      versaoTermos: VERSAO_TERMOS,
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

    return emitirSessao(usuario, this.refreshTokenGateway).then(async (sessao) => {
      await dispararVerificacaoEmail(usuario, this.email);
      return sessao;
    });
  }
}
