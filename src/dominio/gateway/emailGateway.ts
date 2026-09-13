export type EmailEnviarInput = {
  para: string;
  assunto: string;
  texto: string;
  html?: string;
  responderPara?: string;
};

export interface EmailGateway {
  enviar(input: EmailEnviarInput): Promise<void>;
}
