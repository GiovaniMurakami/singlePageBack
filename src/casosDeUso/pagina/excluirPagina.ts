import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";

export class ExcluirPagina implements CasoDeUso<{ paginaId: string; usuarioId: string }, { ok: true }> {
  private constructor(private readonly paginaGateway: PaginaGateway) {}

  public static criar(paginaGateway: PaginaGateway) {
    return new ExcluirPagina(paginaGateway);
  }

  public async executar(input: { paginaId: string; usuarioId: string }) {
    const pagina = await this.paginaGateway.buscarPorId(input.paginaId);
    if (!pagina || pagina.usuarioId !== input.usuarioId) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    await this.paginaGateway.excluir(pagina);
    return { ok: true as const };
  }
}
