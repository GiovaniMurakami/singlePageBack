import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { obterPlano } from "../../helpers/planos";
import { serializarPagina } from "./serializarPagina";

export class BuscarPaginaPublica implements CasoDeUso<{ slug: string }, ReturnType<typeof serializarPagina> & { marca: boolean; anuncios: boolean }> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly usuarioGateway: UsuarioGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, usuarioGateway: UsuarioGateway) {
    return new BuscarPaginaPublica(paginaGateway, usuarioGateway);
  }

  public async executar(input: { slug: string }) {
    const pagina = await this.paginaGateway.buscarPorSlug(input.slug);
    if (!pagina || !pagina.publicada) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }

    const dono = await this.usuarioGateway.buscarPorId(pagina.usuarioId);
    const limites = obterPlano(dono?.planoEfetivo());
    return {
      ...serializarPagina(pagina),
      marca: !limites.removeMarca,
      anuncios: limites.anuncios,
    };
  }
}
