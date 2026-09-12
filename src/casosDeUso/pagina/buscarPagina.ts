import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { serializarPagina } from "./serializarPagina";

export class BuscarPagina implements CasoDeUso<{ paginaId: string; usuarioId: string }, ReturnType<typeof serializarPagina>> {
  private constructor(private readonly paginaGateway: PaginaGateway) {}

  public static criar(paginaGateway: PaginaGateway) {
    return new BuscarPagina(paginaGateway);
  }

  public async executar(input: { paginaId: string; usuarioId: string }) {
    const pagina = await this.paginaGateway.buscarPorId(input.paginaId);
    if (!pagina || pagina.usuarioId !== input.usuarioId) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    return serializarPagina(pagina);
  }
}
