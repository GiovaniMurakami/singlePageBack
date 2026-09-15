import { CasosDeUso } from "./casos";
import { HealthRota } from "../infra/api/express/rotas/health.express.route";
import {
  BuscarPerfilRota,
  CadastrarUsuarioRota,
  LoginUsuarioRota,
  LogoutUsuarioRota,
  RefreshTokenRota,
  VerificarEmailRota,
  ReenviarVerificacaoEmailRota,
  PedirRedefinicaoSenhaRota,
  RedefinirSenhaRota,
  AlterarSenhaRota,
} from "../infra/api/express/rotas/usuario/usuarioRotas.express.route";
import {
  AtualizarPaginaRota,
  BuscarPaginaPublicaRota,
  BuscarPaginaRota,
  CriarPaginaRota,
  ExcluirPaginaRota,
  ListarPaginasRota,
  ObterAnalyticsPaginaRota,
  PublicarPaginaRota,
  RegistrarEventoPaginaRota,
  EnviarFormularioPaginaRota,
} from "../infra/api/express/rotas/pagina/paginaRotas.express.route";
import {
  CriarCheckoutRota,
  CriarPortalRota,
  ListarPlanosRota,
  ProcessarWebhookRota,
} from "../infra/api/express/rotas/assinatura/assinaturaRotas.express.route";
import { GerarUrlUploadImagemRota } from "../infra/api/express/rotas/imagem/gerarUrlUploadImagem.express.route";
import { EnviarPedidoAjudaRota } from "../infra/api/express/rotas/suporte/suporteRotas.express.route";
import {
  AlternarCurtidaRota,
  ListarComunidadeRota,
} from "../infra/api/express/rotas/comunidade/comunidadeRotas.express.route";

export function criarRotas(casos: CasosDeUso) {
  return [
    HealthRota.criar(),
    CadastrarUsuarioRota.criar(casos.cadastrarUsuario),
    LoginUsuarioRota.criar(casos.loginUsuario),
    RefreshTokenRota.criar(casos.refreshToken),
    LogoutUsuarioRota.criar(casos.logoutUsuario),
    BuscarPerfilRota.criar(casos.buscarPerfil),
    VerificarEmailRota.criar(casos.verificarEmail),
    ReenviarVerificacaoEmailRota.criar(casos.reenviarVerificacaoEmail),
    PedirRedefinicaoSenhaRota.criar(casos.pedirRedefinicaoSenha),
    RedefinirSenhaRota.criar(casos.redefinirSenha),
    AlterarSenhaRota.criar(casos.alterarSenha),
    CriarPaginaRota.criar(casos.criarPagina),
    ListarPaginasRota.criar(casos.listarPaginas),
    BuscarPaginaRota.criar(casos.buscarPagina),
    AtualizarPaginaRota.criar(casos.atualizarPagina),
    PublicarPaginaRota.criar(casos.publicarPagina),
    ExcluirPaginaRota.criar(casos.excluirPagina),
    BuscarPaginaPublicaRota.criar(casos.buscarPaginaPublica),
    EnviarFormularioPaginaRota.criar(casos.enviarFormularioPagina),
    RegistrarEventoPaginaRota.criar(casos.registrarEventoPagina),
    ObterAnalyticsPaginaRota.criar(casos.obterAnalyticsPagina),
    ListarComunidadeRota.criar(casos.listarComunidade),
    AlternarCurtidaRota.criar(casos.alternarCurtida),
    ListarPlanosRota.criar(casos.listarPlanos),
    CriarCheckoutRota.criar(casos.criarCheckout),
    CriarPortalRota.criar(casos.criarPortal),
    ProcessarWebhookRota.criar(casos.processarWebhook),
    GerarUrlUploadImagemRota.criar(casos.gerarUrlUploadImagem),
    EnviarPedidoAjudaRota.criar(casos.enviarPedidoAjuda),
  ];
}
