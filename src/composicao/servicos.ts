import { S3Servico } from "../infra/services/s3Servico";
import { StripeServico } from "../infra/services/stripeServico";
import { SesServico } from "../infra/services/sesServico";

export function criarServicos() {
  return {
    imagem: S3Servico.criar(),
    stripe: StripeServico.criar(),
    email: SesServico.criar(),
  };
}

export type Servicos = ReturnType<typeof criarServicos>;
