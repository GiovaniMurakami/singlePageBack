import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { StripeGateway } from "../../dominio/gateway/stripeGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { getFrontendUrl } from "../../helpers/env";

export class CriarPortal implements CasoDeUso<{ usuarioId: string }, { url: string }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly stripeGateway: StripeGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, stripeGateway: StripeGateway) {
    return new CriarPortal(usuarioGateway, stripeGateway);
  }

  public async executar(input: { usuarioId: string }) {
    const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
    if (!usuario?.stripeCustomerId) {
      throw ErroPersonalizado.criar({
        mensagem: "Nenhuma assinatura encontrada para gerenciar.",
        status: StatusErro.erroParametro,
      });
    }

    return this.stripeGateway.criarSessaoPortal(usuario.stripeCustomerId, `${getFrontendUrl()}/conta`);
  }
}
