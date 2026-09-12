import Stripe from "stripe";
import {
  CriarCheckoutInput,
  EventoAssinatura,
  StripeGateway,
} from "../../dominio/gateway/stripeGateway";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { getStripePriceId, getStripeSecretKey, getStripeWebhookSecret } from "../../helpers/env";

function mapearStatus(status: Stripe.Subscription.Status | null | undefined): EventoAssinatura["status"] {
  if (status === "active") return "ativa";
  if (status === "trialing") return "trial";
  if (status === "past_due" || status === "unpaid") return "atrasada";
  if (status === "canceled" || status === "incomplete_expired") return "cancelada";
  return "nenhuma";
}

function mapearPlano(subscription: Stripe.Subscription | null, priceId?: string | null): EventoAssinatura["plano"] {
  const ids = [
    priceId,
    ...(subscription?.items.data.map((item) =>
      typeof item.price === "string" ? item.price : item.price.id
    ) ?? []),
  ].filter(Boolean);

  if (ids.includes(getStripePriceId("ultra"))) return "ultra";
  if (ids.includes(getStripePriceId("pro"))) return "pro";
  return "free";
}

export class StripeServico implements StripeGateway {
  private stripeCliente: Stripe | null = null;

  public static criar() {
    return new StripeServico();
  }

  private stripe(): Stripe {
    if (this.stripeCliente) return this.stripeCliente;
    const key = getStripeSecretKey();
    if (!key) {
      throw ErroPersonalizado.criar({
        mensagem: "Stripe não configurado. Defina STRIPE_SECRET_KEY.",
        status: StatusErro.erroServidor,
      });
    }
    this.stripeCliente = new Stripe(key);
    return this.stripeCliente;
  }

  public async criarSessaoCheckout(input: CriarCheckoutInput) {
    const price = getStripePriceId(input.plano);
    if (!price) {
      throw ErroPersonalizado.criar({
        mensagem: `Preço Stripe do plano ${input.plano} não configurado.`,
        status: StatusErro.erroServidor,
      });
    }

    const sessao = await this.stripe().checkout.sessions.create({
      mode: "subscription",
      customer: input.customerId || undefined,
      customer_email: input.customerId ? undefined : input.email,
      client_reference_id: input.usuarioId,
      line_items: [{ price, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { usuarioId: input.usuarioId, plano: input.plano },
      subscription_data: {
        metadata: { usuarioId: input.usuarioId, plano: input.plano },
      },
    });

    if (!sessao.url) {
      throw ErroPersonalizado.criar({
        mensagem: "Não foi possível iniciar o checkout.",
        status: StatusErro.erroServidor,
      });
    }

    return {
      url: sessao.url,
      customerId: typeof sessao.customer === "string" ? sessao.customer : sessao.customer?.id ?? null,
    };
  }

  public async criarSessaoPortal(customerId: string, returnUrl: string) {
    const sessao = await this.stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: sessao.url };
  }

  public construirEvento(payload: Buffer, assinatura: string): EventoAssinatura | null {
    const secret = getStripeWebhookSecret();
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET ausente.");
    }

    const evento = this.stripe().webhooks.constructEvent(payload, assinatura, secret);

    if (evento.type === "checkout.session.completed") {
      const sessao = evento.data.object as Stripe.Checkout.Session;
      const customerId = typeof sessao.customer === "string" ? sessao.customer : sessao.customer?.id;
      if (!customerId) throw new Error("Checkout sem customer.");
      return {
        tipo: "checkout.completed",
        customerId,
        usuarioId: sessao.metadata?.usuarioId || sessao.client_reference_id || null,
        subscriptionId: typeof sessao.subscription === "string" ? sessao.subscription : sessao.subscription?.id ?? null,
        plano: sessao.metadata?.plano === "ultra" ? "ultra" : "pro",
        status: "ativa",
      };
    }

    if (evento.type === "customer.subscription.updated" || evento.type === "customer.subscription.deleted") {
      const subscription = evento.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const status = evento.type === "customer.subscription.deleted" ? "cancelada" : mapearStatus(subscription.status);
      return {
        tipo: evento.type === "customer.subscription.deleted" ? "subscription.deleted" : "subscription.updated",
        customerId,
        usuarioId: subscription.metadata?.usuarioId || null,
        subscriptionId: subscription.id,
        plano: status === "cancelada" ? "free" : mapearPlano(subscription),
        status: status === "cancelada" ? "cancelada" : status,
      };
    }

    return null;
  }
}
