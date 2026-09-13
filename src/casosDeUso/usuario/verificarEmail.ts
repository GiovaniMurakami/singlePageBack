import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { signToken, verifyToken } from "../../helpers/jwt";
import { emailVerificacao } from "../../helpers/emailModelos";
import { enviarEmailComSeguranca } from "../../infra/services/sesServico";

export async function dispararVerificacaoEmail(usuario: { id: string; nome: string; email: string; role: string }, email: EmailGateway) {
  const token = signToken({
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    role: usuario.role,
    purpose: "verify",
  }, "48h");
  if (!token) return;
  const modelo = emailVerificacao(usuario.nome, token);
  await enviarEmailComSeguranca(email, {
    para: usuario.email,
    assunto: modelo.assunto,
    texto: modelo.texto,
    html: modelo.html,
  });
}

export class VerificarEmail implements CasoDeUso<{ token: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway) {
    return new VerificarEmail(usuarioGateway);
  }

  public async executar(input: { token: string }) {
    const payload = verifyToken(input.token);
    if (!payload || payload.purpose !== "verify") {
      throw ErroPersonalizado.criar({
        mensagem: "Link de verificação inválido ou expirado.",
        status: StatusErro.erroParametro,
      });
    }
    const usuario = await this.usuarioGateway.buscarPorId(payload.id);
    if (!usuario || usuario.email !== payload.email) {
      throw ErroPersonalizado.criar({
        mensagem: "Link de verificação inválido ou expirado.",
        status: StatusErro.erroParametro,
      });
    }
    usuario.emailVerificado = true;
    await this.usuarioGateway.atualizar(usuario);
    return { ok: true as const };
  }
}

export class ReenviarVerificacaoEmail implements CasoDeUso<{ usuarioId: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, email: EmailGateway) {
    return new ReenviarVerificacaoEmail(usuarioGateway, email);
  }

  public async executar(input: { usuarioId: string }) {
    const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw ErroPersonalizado.criar({
        mensagem: "Usuário não encontrado.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    if (usuario.emailVerificado) return { ok: true as const };
    await dispararVerificacaoEmail(usuario, this.email);
    return { ok: true as const };
  }
}
