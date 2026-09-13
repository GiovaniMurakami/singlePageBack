import bcrypt from "bcryptjs";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { signToken, verifyToken } from "../../helpers/jwt";
import { emailRedefinirSenha, emailSenhaAlterada } from "../../helpers/emailModelos";
import { enviarEmailComSeguranca } from "../../infra/services/sesServico";

export class PedirRedefinicaoSenha implements CasoDeUso<{ email: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, email: EmailGateway) {
    return new PedirRedefinicaoSenha(usuarioGateway, email);
  }

  public async executar(input: { email: string }) {
    const usuario = await this.usuarioGateway.buscarPorEmail(input.email.trim().toLowerCase());
    if (usuario) {
      const token = signToken({
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
        purpose: "reset",
      }, "1h");
      if (token) {
        const modelo = emailRedefinirSenha(usuario.nome, token);
        await enviarEmailComSeguranca(this.email, {
          para: usuario.email,
          assunto: modelo.assunto,
          texto: modelo.texto,
          html: modelo.html,
        });
      }
    }
    return { ok: true as const };
  }
}

export class RedefinirSenha implements CasoDeUso<{ token: string; senha: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, email: EmailGateway) {
    return new RedefinirSenha(usuarioGateway, email);
  }

  public async executar(input: { token: string; senha: string }) {
    const payload = verifyToken(input.token);
    if (!payload || payload.purpose !== "reset") {
      throw ErroPersonalizado.criar({
        mensagem: "Link para redefinir senha inválido ou expirado.",
        status: StatusErro.erroParametro,
      });
    }
    const usuario = await this.usuarioGateway.buscarPorId(payload.id);
    if (!usuario || usuario.email !== payload.email) {
      throw ErroPersonalizado.criar({
        mensagem: "Link para redefinir senha inválido ou expirado.",
        status: StatusErro.erroParametro,
      });
    }
    usuario.senha = await bcrypt.hash(input.senha, 12);
    await this.usuarioGateway.atualizar(usuario);
    const modelo = emailSenhaAlterada(usuario.nome);
    await enviarEmailComSeguranca(this.email, {
      para: usuario.email,
      assunto: modelo.assunto,
      texto: modelo.texto,
      html: modelo.html,
    });
    return { ok: true as const };
  }
}

export class AlterarSenha implements CasoDeUso<{ usuarioId: string; senhaAtual: string; senhaNova: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, email: EmailGateway) {
    return new AlterarSenha(usuarioGateway, email);
  }

  public async executar(input: { usuarioId: string; senhaAtual: string; senhaNova: string }) {
    const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw ErroPersonalizado.criar({
        mensagem: "Usuário não encontrado.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    const ok = await bcrypt.compare(input.senhaAtual, usuario.senha);
    if (!ok) {
      throw ErroPersonalizado.criar({
        mensagem: "Senha atual incorreta.",
        status: StatusErro.erroNaoAutorizado,
      });
    }
    usuario.senha = await bcrypt.hash(input.senhaNova, 12);
    await this.usuarioGateway.atualizar(usuario);
    const modelo = emailSenhaAlterada(usuario.nome);
    await enviarEmailComSeguranca(this.email, {
      para: usuario.email,
      assunto: modelo.assunto,
      texto: modelo.texto,
      html: modelo.html,
    });
    return { ok: true as const };
  }
}
