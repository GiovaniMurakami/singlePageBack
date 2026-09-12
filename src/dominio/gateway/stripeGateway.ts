export type CriarCheckoutInput = {
  usuarioId: string;
  email: string;
  nome: string;
  plano: "pro" | "ultra";
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
};

export type EventoAssinatura = {
  tipo: "checkout.completed" | "subscription.updated" | "subscription.deleted";
  customerId: string;
  usuarioId?: string | null;
  subscriptionId: string | null;
  plano: "pro" | "ultra" | "free";
  status: "ativa" | "trial" | "atrasada" | "cancelada" | "nenhuma";
};

export interface StripeGateway {
  criarSessaoCheckout(input: CriarCheckoutInput): Promise<{ url: string; customerId: string | null }>;
  criarSessaoPortal(customerId: string, returnUrl: string): Promise<{ url: string }>;
  construirEvento(payload: Buffer, assinatura: string): EventoAssinatura | null;
}
