import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { StripeGateway } from "../../dominio/gateway/stripeGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { logger } from "../../helpers/logger";

export class ProcessarWebhook implements CasoDeUso<{ payload: Buffer; assinatura: string }, { ok: true }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly stripeGateway: StripeGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, stripeGateway: StripeGateway) {
    return new ProcessarWebhook(usuarioGateway, stripeGateway);
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

    usuario.stripeCustomerId = evento.customerId;
    usuario.stripeSubscriptionId = evento.subscriptionId;
    usuario.plano = evento.plano;
    usuario.statusAssinatura = evento.status;
    await this.usuarioGateway.atualizar(usuario);
    return { ok: true as const };
  }
}
