import { Pagina } from "../../dominio/entidade/pagina";
import { PaginaGateway, SlugPaginaJaExisteErro } from "../../dominio/gateway/paginaGateway";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { obterPlano } from "../../helpers/planos";
import { serializarPagina } from "./serializarPagina";

export type CriarPaginaInputDto = {
  usuarioId: string;
  titulo: string;
  slug: string;
  tema?: Pagina["tema"];
  blocos?: Pagina["blocos"];
};

export class CriarPagina implements CasoDeUso<CriarPaginaInputDto, ReturnType<typeof serializarPagina>> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly usuarioGateway: UsuarioGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, usuarioGateway: UsuarioGateway) {
    return new CriarPagina(paginaGateway, usuarioGateway);
  }

  public async executar(input: CriarPaginaInputDto) {
    const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw ErroPersonalizado.criar({
        mensagem: "Usuário não encontrado.",
        status: StatusErro.erroNaoEncontrado,
      });
    }

    const limites = obterPlano(usuario.planoEfetivo());
    const total = await this.paginaGateway.contarPorUsuario(input.usuarioId);
    if (total >= limites.paginasMaximas) {
      throw ErroPersonalizado.criar({
        mensagem: `Seu plano ${limites.nome} permite até ${limites.paginasMaximas} página(s). Faça upgrade para criar mais.`,
        status: StatusErro.erroProibido,
      });
    }

    const pagina = Pagina.criar({
      usuarioId: input.usuarioId,
      titulo: input.titulo,
      slug: input.slug,
      tema: input.tema,
      blocos: input.blocos,
    });

    try {
      await this.paginaGateway.salvar(pagina);
    } catch (error) {
      if (error instanceof SlugPaginaJaExisteErro) {
        throw ErroPersonalizado.criar({
          mensagem: "Este endereço já está em uso. Escolha outro slug.",
          status: StatusErro.erroConflito,
        });
      }
      throw error;
    }

    return serializarPagina(pagina);
  }
}
