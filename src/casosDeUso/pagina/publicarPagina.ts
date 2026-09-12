import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { obterPlano } from "../../helpers/planos";
import { serializarPagina } from "./serializarPagina";

export class PublicarPagina implements CasoDeUso<
  { paginaId: string; usuarioId: string; publicada: boolean },
  ReturnType<typeof serializarPagina>
> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly usuarioGateway: UsuarioGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, usuarioGateway: UsuarioGateway) {
    return new PublicarPagina(paginaGateway, usuarioGateway);
  }

  public async executar(input: { paginaId: string; usuarioId: string; publicada: boolean }) {
    const pagina = await this.paginaGateway.buscarPorId(input.paginaId);
    if (!pagina || pagina.usuarioId !== input.usuarioId) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }

    if (input.publicada && pagina.blocos.length === 0) {
      throw ErroPersonalizado.criar({
        mensagem: "Adicione pelo menos um bloco antes de publicar.",
        status: StatusErro.erroParametro,
      });
    }

    if (input.publicada && !pagina.publicada) {
      const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
      if (!usuario) {
        throw ErroPersonalizado.criar({
          mensagem: "Usuário não encontrado.",
          status: StatusErro.erroNaoEncontrado,
        });
      }
      const limites = obterPlano(usuario.planoEfetivo());
      const paginas = await this.paginaGateway.listarPorUsuario(input.usuarioId);
      const publicadas = paginas.filter((item) => item.publicada && item.id !== pagina.id).length;
      if (publicadas >= limites.paginasMaximas) {
        throw ErroPersonalizado.criar({
          mensagem: `Seu plano ${limites.nome} permite até ${limites.paginasMaximas} página(s) publicada(s).`,
          status: StatusErro.erroProibido,
        });
      }
    }

    pagina.publicada = input.publicada;
    pagina.publicadoEm = input.publicada ? new Date() : pagina.publicadoEm;
    pagina.atualizadoEm = new Date();
    await this.paginaGateway.atualizar(pagina, pagina.slug);
    return serializarPagina(pagina);
  }
}
