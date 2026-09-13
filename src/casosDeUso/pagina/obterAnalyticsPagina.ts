import { AnalyticsGateway } from "../../dominio/gateway/analyticsGateway";
import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";

export class ObterAnalyticsPagina implements CasoDeUso<{ paginaId: string; usuarioId: string }, Awaited<ReturnType<AnalyticsGateway["obter"]>> & { pagina: { id: string; titulo: string; slug: string; publicada: boolean } }> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly analyticsGateway: AnalyticsGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, analyticsGateway: AnalyticsGateway) {
    return new ObterAnalyticsPagina(paginaGateway, analyticsGateway);
  }

  public async executar(input: { paginaId: string; usuarioId: string }) {
    const pagina = await this.paginaGateway.buscarPorId(input.paginaId);
    if (!pagina || pagina.usuarioId !== input.usuarioId) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    const dados = await this.analyticsGateway.obter(pagina.id, 14);
    return {
      ...dados,
      pagina: {
        id: pagina.id,
        titulo: pagina.titulo,
        slug: pagina.slug,
        publicada: pagina.publicada,
      },
    };
  }
}
