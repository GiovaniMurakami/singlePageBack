import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { StripeGateway } from "../../dominio/gateway/stripeGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { getFrontendUrl } from "../../helpers/env";

export class CriarCheckout implements CasoDeUso<{ usuarioId: string; plano: "pro" | "ultra" }, { url: string }> {
  private constructor(
    private readonly usuarioGateway: UsuarioGateway,
    private readonly stripeGateway: StripeGateway
  ) {}

  public static criar(usuarioGateway: UsuarioGateway, stripeGateway: StripeGateway) {
    return new CriarCheckout(usuarioGateway, stripeGateway);
  }

  public async executar(input: { usuarioId: string; plano: "pro" | "ultra" }) {
    const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw ErroPersonalizado.criar({
        mensagem: "Usuário não encontrado.",
        status: StatusErro.erroNaoEncontrado,
      });
    }

    const frontend = getFrontendUrl();
    const sessao = await this.stripeGateway.criarSessaoCheckout({
      usuarioId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      plano: input.plano,
      customerId: usuario.stripeCustomerId,
      successUrl: `${frontend}/conta?checkout=sucesso`,
      cancelUrl: `${frontend}/precos?checkout=cancelado`,
    });

    if (sessao.customerId && sessao.customerId !== usuario.stripeCustomerId) {
      usuario.stripeCustomerId = sessao.customerId;
      await this.usuarioGateway.atualizar(usuario);
    }

    return { url: sessao.url };
  }
}
