import { Pagina } from "../../dominio/entidade/pagina";
import { PaginaGateway, SlugPaginaJaExisteErro } from "../../dominio/gateway/paginaGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { serializarPagina } from "./serializarPagina";

export type AtualizarPaginaInputDto = {
  paginaId: string;
  usuarioId: string;
  titulo?: string;
  slug?: string;
  tema?: Pagina["tema"];
  blocos?: Pagina["blocos"];
};

export class AtualizarPagina implements CasoDeUso<AtualizarPaginaInputDto, ReturnType<typeof serializarPagina>> {
  private constructor(private readonly paginaGateway: PaginaGateway) {}

  public static criar(paginaGateway: PaginaGateway) {
    return new AtualizarPagina(paginaGateway);
  }

  public async executar(input: AtualizarPaginaInputDto) {
    const pagina = await this.paginaGateway.buscarPorId(input.paginaId);
    if (!pagina || pagina.usuarioId !== input.usuarioId) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }

    const slugAnterior = pagina.slug;
    if (input.titulo) pagina.titulo = input.titulo.trim();
    if (input.slug) pagina.slug = input.slug.trim().toLowerCase();
    if (input.tema) pagina.tema = input.tema;
    if (input.blocos) pagina.blocos = input.blocos;
    pagina.atualizadoEm = new Date();

    try {
      await this.paginaGateway.atualizar(pagina, slugAnterior);
    } catch (error) {
      if (error instanceof SlugPaginaJaExisteErro) {
        throw ErroPersonalizado.criar({
          mensagem: "Este endereço já está em uso. Escolha outro nome.",
          status: StatusErro.erroConflito,
        });
      }
      throw error;
    }

    return serializarPagina(pagina);
  }
}
