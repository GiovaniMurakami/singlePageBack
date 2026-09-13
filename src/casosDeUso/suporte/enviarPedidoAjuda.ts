import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { getEmailSuporte } from "../../helpers/emailEnv";
import { emailPedidoAjuda } from "../../helpers/emailModelos";

export type EnviarPedidoAjudaInput = {
  nome: string;
  email: string;
  assunto: string;
  pagina?: string;
  esperado?: string;
  aconteceu?: string;
  mensagem?: string;
  navegador?: string;
};

export class EnviarPedidoAjuda implements CasoDeUso<EnviarPedidoAjudaInput, { ok: true }> {
  private constructor(private readonly email: EmailGateway) {}

  public static criar(email: EmailGateway) {
    return new EnviarPedidoAjuda(email);
  }

  public async executar(input: EnviarPedidoAjudaInput) {
    const nome = input.nome.trim();
    const emailResposta = input.email.trim().toLowerCase();
    if (!nome || !emailResposta) {
      throw ErroPersonalizado.criar({
        mensagem: "Informe nome e e-mail para eu te responder.",
        status: StatusErro.erroParametro,
      });
    }
    const modelo = emailPedidoAjuda({ ...input, nome, email: emailResposta });
    await this.email.enviar({
      para: getEmailSuporte(),
      responderPara: emailResposta,
      assunto: modelo.assunto,
      texto: modelo.texto,
    });
    return { ok: true as const };
  }
}
