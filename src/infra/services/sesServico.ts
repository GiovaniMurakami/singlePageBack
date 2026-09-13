import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailEnviarInput, EmailGateway } from "../../dominio/gateway/emailGateway";
import { getSesFrom } from "../../helpers/emailEnv";
import { logger } from "../../helpers/logger";

export class SesServico implements EmailGateway {
  private readonly client: SESv2Client;

  private constructor() {
    this.client = new SESv2Client({ region: "us-east-1" });
  }

  public static criar(): SesServico {
    return new SesServico();
  }

  public async enviar(input: EmailEnviarInput): Promise<void> {
    await this.client.send(new SendEmailCommand({
      FromEmailAddress: getSesFrom(),
      Destination: { ToAddresses: [input.para] },
      ReplyToAddresses: input.responderPara ? [input.responderPara] : undefined,
      Content: {
        Simple: {
          Subject: { Data: input.assunto, Charset: "UTF-8" },
          Body: {
            Text: { Data: input.texto, Charset: "UTF-8" },
            ...(input.html ? { Html: { Data: input.html, Charset: "UTF-8" } } : {}),
          },
        },
      },
    }));
  }
}

export async function enviarEmailComSeguranca(email: EmailGateway, input: EmailEnviarInput): Promise<void> {
  try {
    await email.enviar(input);
  } catch (error) {
    logger.error({ err: error, para: input.para, assunto: input.assunto }, "falha ao enviar e-mail");
  }
}
