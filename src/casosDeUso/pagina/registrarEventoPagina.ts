import { AnalyticsGateway, EventoAnalytics } from "../../dominio/gateway/analyticsGateway";
import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";

export class RegistrarEventoPagina implements CasoDeUso<{ slug: string } & EventoAnalytics, { ok: true }> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly analyticsGateway: AnalyticsGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, analyticsGateway: AnalyticsGateway) {
    return new RegistrarEventoPagina(paginaGateway, analyticsGateway);
  }

  public async executar(input: { slug: string } & EventoAnalytics) {
    const pagina = await this.paginaGateway.buscarPorSlug(input.slug);
    if (!pagina || !pagina.publicada) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    await this.analyticsGateway.registrar(pagina.id, {
      tipo: input.tipo,
      visitanteId: input.visitanteId,
      alvo: input.alvo,
      origem: input.origem,
      hora: input.hora,
    });
    return { ok: true as const };
  }
}
