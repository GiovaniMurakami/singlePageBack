import { S3Servico } from "../infra/services/s3Servico";
import { StripeServico } from "../infra/services/stripeServico";

export function criarServicos() {
  return {
    imagem: S3Servico.criar(),
    stripe: StripeServico.criar(),
  };
}

export type Servicos = ReturnType<typeof criarServicos>;
