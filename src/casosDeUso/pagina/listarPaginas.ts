import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { serializarPaginaResumo } from "./serializarPagina";

export class ListarPaginas implements CasoDeUso<{ usuarioId: string }, ReturnType<typeof serializarPaginaResumo>[]> {
  private constructor(private readonly paginaGateway: PaginaGateway) {}

  public static criar(paginaGateway: PaginaGateway) {
    return new ListarPaginas(paginaGateway);
  }

  public async executar(input: { usuarioId: string }) {
    const paginas = await this.paginaGateway.listarPorUsuario(input.usuarioId);
    return paginas
      .sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime())
      .map(serializarPaginaResumo);
  }
}
