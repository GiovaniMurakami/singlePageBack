import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { obterPlano } from "../../helpers/planos";
import { serializarPagina } from "./serializarPagina";
import { emailPaginaPublicada } from "../../helpers/emailModelos";
import { enviarEmailComSeguranca } from "../../infra/services/sesServico";
import { urlPublicaPagina } from "../../helpers/env";

export class PublicarPagina implements CasoDeUso<
  { paginaId: string; usuarioId: string; publicada: boolean },
  ReturnType<typeof serializarPagina>
> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly usuarioGateway: UsuarioGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, usuarioGateway: UsuarioGateway, email: EmailGateway) {
    return new PublicarPagina(paginaGateway, usuarioGateway, email);
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

    const acabouDePublicar = input.publicada && !pagina.publicada;
    pagina.publicada = input.publicada;
    pagina.publicadoEm = input.publicada ? new Date() : pagina.publicadoEm;
    pagina.atualizadoEm = new Date();
    await this.paginaGateway.atualizar(pagina, pagina.slug);
    if (acabouDePublicar) {
      const dono = await this.usuarioGateway.buscarPorId(input.usuarioId);
      if (dono) {
        const url = urlPublicaPagina(pagina.slug);
        const modelo = emailPaginaPublicada(dono.nome, pagina.titulo, url);
        await enviarEmailComSeguranca(this.email, {
          para: dono.email,
          assunto: modelo.assunto,
          texto: modelo.texto,
          html: modelo.html,
        });
      }
    }
    return serializarPagina(pagina);
  }
}
