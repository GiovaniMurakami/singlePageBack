import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { StripeGateway } from "../../dominio/gateway/stripeGateway";
import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { logger } from "../../helpers/logger";
import { emailPlanoAlterado } from "../../helpers/emailModelos";
import { enviarEmailComSeguranca } from "../../infra/services/sesServico";

export class ProcessarWebhook implements CasoDeUso<{ payload: Buffer; assinatura: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly stripeGateway: StripeGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, stripeGateway: StripeGateway, email: EmailGateway) {
    return new ProcessarWebhook(usuarioGateway, stripeGateway, email);
  }

  public async executar(input: { payload: Buffer; assinatura: string }) {
    let evento;
    try {
      evento = this.stripeGateway.construirEvento(input.payload, input.assinatura);
    } catch (error) {
      logger.warn({ err: error }, "assinatura de webhook stripe invalida");
      throw ErroPersonalizado.criar({
        mensagem: "Assinatura do webhook inválida.",
        status: StatusErro.erroNaoAutorizado,
      });
    }

    if (!evento) return { ok: true as const };

    const usuario = (evento.usuarioId
      ? await this.usuarioGateway.buscarPorId(evento.usuarioId)
      : null) ?? await this.usuarioGateway.buscarPorStripeCustomerId(evento.customerId);
    if (!usuario) {
      logger.warn({ customerId: evento.customerId, tipo: evento.tipo }, "cliente stripe sem usuario");
      return { ok: true as const };
    }

    const planoAnterior = usuario.plano;
    const statusAnterior = usuario.statusAssinatura;
    usuario.stripeCustomerId = evento.customerId;
    usuario.stripeSubscriptionId = evento.subscriptionId;
    usuario.plano = evento.plano;
    usuario.statusAssinatura = evento.status;
    await this.usuarioGateway.atualizar(usuario);
    if (planoAnterior !== usuario.plano || statusAnterior !== usuario.statusAssinatura) {
      const modelo = emailPlanoAlterado(usuario.nome, usuario.planoEfetivo(), usuario.statusAssinatura);
      await enviarEmailComSeguranca(this.email, {
        para: usuario.email,
        assunto: modelo.assunto,
        texto: modelo.texto,
        html: modelo.html,
      });
    }
    return { ok: true as const };
  }
}
