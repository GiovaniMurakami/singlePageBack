import { ComunidadeGateway } from "../../dominio/gateway/comunidadeGateway";
import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";

export class AlternarCurtida implements CasoDeUso<
  { paginaId: string; usuarioId: string },
  { curtiu: boolean; curtidas: number }
> {
  private constructor(
    private readonly comunidadeGateway: ComunidadeGateway,
    private readonly paginaGateway: PaginaGateway
  ) {}

  public static criar(comunidadeGateway: ComunidadeGateway, paginaGateway: PaginaGateway) {
    return new AlternarCurtida(comunidadeGateway, paginaGateway);
  }

  public async executar(input: { paginaId: string; usuarioId: string }) {
    const pagina = await this.paginaGateway.buscarPorId(input.paginaId);
    if (!pagina || !pagina.publicada) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }

    const jaCurtiu = await this.comunidadeGateway.curtiu(input.paginaId, input.usuarioId);
    const curtidas = jaCurtiu
      ? await this.comunidadeGateway.descurtir(input.paginaId, input.usuarioId)
      : await this.comunidadeGateway.curtir(input.paginaId, input.usuarioId);

    return {
      curtiu: !jaCurtiu,
      curtidas,
    };
  }
}
