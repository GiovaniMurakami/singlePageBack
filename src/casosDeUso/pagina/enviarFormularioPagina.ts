import { PaginaGateway } from "../../dominio/gateway/paginaGateway";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { EmailGateway } from "../../dominio/gateway/emailGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { emailFormulario } from "../../helpers/emailModelos";
import { BlocoPagina } from "../../dominio/entidade/pagina";

function acharBlocoFormulario(blocos: BlocoPagina[] = []): BlocoPagina | undefined {
  for (const bloco of blocos) {
    if (bloco.tipo === "formulario") return bloco;
    const props = bloco.props || {};
    const filhos = Array.isArray(props.blocos) ? (props.blocos as BlocoPagina[]) : [];
    const celulas = Array.isArray(props.celulas) ? (props.celulas as { blocos?: BlocoPagina[] }[]) : [];
    const achado = acharBlocoFormulario(filhos) || acharBlocoFormulario(celulas.flatMap((celula) => celula.blocos || []));
    if (achado) return achado;
  }
  return undefined;
}

export type CampoFormularioEnviado = {
  rotulo: string;
  tipo?: string;
  valor?: unknown;
};

export class EnviarFormularioPagina implements CasoDeUso<
  { slug: string; assunto?: string; campos: CampoFormularioEnviado[] },
  { ok: true }
> {
  private constructor(
    private readonly paginaGateway: PaginaGateway,
    private readonly usuarioGateway: UsuarioGateway,
    private readonly email: EmailGateway
  ) {}

  public static criar(paginaGateway: PaginaGateway, usuarioGateway: UsuarioGateway, email: EmailGateway) {
    return new EnviarFormularioPagina(paginaGateway, usuarioGateway, email);
  }

  public async executar(input: { slug: string; assunto?: string; campos: CampoFormularioEnviado[] }) {
    const pagina = await this.paginaGateway.buscarPorSlug(input.slug);
    if (!pagina || !pagina.publicada) {
      throw ErroPersonalizado.criar({
        mensagem: "Página não encontrada.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    const dono = await this.usuarioGateway.buscarPorId(pagina.usuarioId);
    const bloco = acharBlocoFormulario(pagina.blocos);
    const destEmail = String((bloco?.props as { destEmail?: string } | undefined)?.destEmail || dono?.email || "").trim().toLowerCase();
    if (!destEmail) {
      throw ErroPersonalizado.criar({
        mensagem: "Esta página ainda não tem e-mail de destino.",
        status: StatusErro.erroParametro,
      });
    }
    const linhas = (input.campos || []).map((campo) => {
      if (campo.tipo === "check") return `${campo.rotulo}: ${campo.valor ? "sim" : "não"}`;
      const valor = campo.valor == null ? "" : String(campo.valor).trim();
      return valor ? `${campo.rotulo}: ${valor}` : "";
    }).filter(Boolean);
    if (!linhas.length) {
      throw ErroPersonalizado.criar({
        mensagem: "Preencha o formulário antes de enviar.",
        status: StatusErro.erroParametro,
      });
    }
    const modelo = emailFormulario(pagina.titulo, pagina.slug, input.assunto || "", linhas);
    await this.email.enviar({
      para: destEmail,
      assunto: modelo.assunto,
      texto: modelo.texto,
      html: modelo.html,
    });
    return { ok: true as const };
  }
}
