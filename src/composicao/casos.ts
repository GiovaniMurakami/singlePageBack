import { Repositorios } from "./repositorios";
import { Servicos } from "./servicos";
import { CadastrarUsuario } from "../casosDeUso/usuario/cadastrarUsuario";
import { LoginUsuario } from "../casosDeUso/usuario/loginUsuario";
import { RefreshToken } from "../casosDeUso/usuario/refreshToken";
import { LogoutUsuario } from "../casosDeUso/usuario/logoutUsuario";
import { BuscarPerfil } from "../casosDeUso/usuario/buscarPerfil";
import { CriarPagina } from "../casosDeUso/pagina/criarPagina";
import { ListarPaginas } from "../casosDeUso/pagina/listarPaginas";
import { BuscarPagina } from "../casosDeUso/pagina/buscarPagina";
import { AtualizarPagina } from "../casosDeUso/pagina/atualizarPagina";
import { PublicarPagina } from "../casosDeUso/pagina/publicarPagina";
import { ExcluirPagina } from "../casosDeUso/pagina/excluirPagina";
import { BuscarPaginaPublica } from "../casosDeUso/pagina/buscarPaginaPublica";
import { RegistrarEventoPagina } from "../casosDeUso/pagina/registrarEventoPagina";
import { ObterAnalyticsPagina } from "../casosDeUso/pagina/obterAnalyticsPagina";
import { ListarPlanos } from "../casosDeUso/assinatura/listarPlanos";
import { CriarCheckout } from "../casosDeUso/assinatura/criarCheckout";
import { CriarPortal } from "../casosDeUso/assinatura/criarPortal";
import { ProcessarWebhook } from "../casosDeUso/assinatura/processarWebhook";
import { GerarUrlUploadImagem } from "../casosDeUso/imagem/gerarUrlUploadImagem";
import { EnviarPedidoAjuda } from "../casosDeUso/suporte/enviarPedidoAjuda";
import { VerificarEmail, ReenviarVerificacaoEmail } from "../casosDeUso/usuario/verificarEmail";
import { PedirRedefinicaoSenha, RedefinirSenha, AlterarSenha } from "../casosDeUso/usuario/senha";
import { EnviarFormularioPagina } from "../casosDeUso/pagina/enviarFormularioPagina";

export function criarCasosDeUso(repos: Repositorios, servicos: Servicos) {
  return {
    cadastrarUsuario: CadastrarUsuario.criar(repos.usuario, repos.refreshToken, servicos.email),
    loginUsuario: LoginUsuario.criar(repos.usuario, repos.refreshToken),
    refreshToken: RefreshToken.criar(repos.usuario, repos.refreshToken),
    logoutUsuario: LogoutUsuario.criar(repos.refreshToken, repos.tokenBlacklist),
    buscarPerfil: BuscarPerfil.criar(repos.usuario),
    verificarEmail: VerificarEmail.criar(repos.usuario),
    reenviarVerificacaoEmail: ReenviarVerificacaoEmail.criar(repos.usuario, servicos.email),
    pedirRedefinicaoSenha: PedirRedefinicaoSenha.criar(repos.usuario, servicos.email),
    redefinirSenha: RedefinirSenha.criar(repos.usuario, servicos.email),
    alterarSenha: AlterarSenha.criar(repos.usuario, servicos.email),
    criarPagina: CriarPagina.criar(repos.pagina, repos.usuario),
    listarPaginas: ListarPaginas.criar(repos.pagina),
    buscarPagina: BuscarPagina.criar(repos.pagina),
    atualizarPagina: AtualizarPagina.criar(repos.pagina),
    publicarPagina: PublicarPagina.criar(repos.pagina, repos.usuario, servicos.email),
    excluirPagina: ExcluirPagina.criar(repos.pagina),
    buscarPaginaPublica: BuscarPaginaPublica.criar(repos.pagina, repos.usuario),
    enviarFormularioPagina: EnviarFormularioPagina.criar(repos.pagina, repos.usuario, servicos.email),
    registrarEventoPagina: RegistrarEventoPagina.criar(repos.pagina, repos.analytics),
    obterAnalyticsPagina: ObterAnalyticsPagina.criar(repos.pagina, repos.analytics),
    listarPlanos: ListarPlanos.criar(),
    criarCheckout: CriarCheckout.criar(repos.usuario, servicos.stripe),
    criarPortal: CriarPortal.criar(repos.usuario, servicos.stripe),
    processarWebhook: ProcessarWebhook.criar(repos.usuario, servicos.stripe, servicos.email),
    gerarUrlUploadImagem: GerarUrlUploadImagem.criar(servicos.imagem),
    enviarPedidoAjuda: EnviarPedidoAjuda.criar(servicos.email),
  };
}

export type CasosDeUso = ReturnType<typeof criarCasosDeUso>;
