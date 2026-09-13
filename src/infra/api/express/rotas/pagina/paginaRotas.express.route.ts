import { RequestHandler } from "express";
import { CriarPagina } from "../../../../../casosDeUso/pagina/criarPagina";
import { ListarPaginas } from "../../../../../casosDeUso/pagina/listarPaginas";
import { BuscarPagina } from "../../../../../casosDeUso/pagina/buscarPagina";
import { AtualizarPagina } from "../../../../../casosDeUso/pagina/atualizarPagina";
import { PublicarPagina } from "../../../../../casosDeUso/pagina/publicarPagina";
import { ExcluirPagina } from "../../../../../casosDeUso/pagina/excluirPagina";
import { BuscarPaginaPublica } from "../../../../../casosDeUso/pagina/buscarPaginaPublica";
import { RegistrarEventoPagina } from "../../../../../casosDeUso/pagina/registrarEventoPagina";
import { ObterAnalyticsPagina } from "../../../../../casosDeUso/pagina/obterAnalyticsPagina";
import { HttpMethod, Rotas, handlerErro } from "../rotas";
import { autenticarJwt } from "../../../../../middlewares/express/autenticarJwt";
import { leituraAutenticadaRateLimiter, mutationRateLimiter, publicReadRateLimiter } from "../../../../../middlewares/express/rateLimiter";
import { atualizarPaginaSchema, criarPaginaSchema, eventoPaginaSchema, publicarPaginaSchema } from "../../../../../helpers/validacao/schemas";
import { validarBody } from "../../../../../helpers/validacao/validarBody";

export class CriarPaginaRota implements Rotas {
  private constructor(private readonly caso: CriarPagina) {}
  public static criar(caso: CriarPagina) { return new CriarPaginaRota(caso); }
  public getCaminho() { return "/pagina"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, mutationRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(criarPaginaSchema, req.body, res);
      if (!dados) return;
      res.status(201).json(await this.caso.executar({ ...dados, usuarioId: req.usuario!.id }));
    });
  }
}

export class ListarPaginasRota implements Rotas {
  private constructor(private readonly caso: ListarPaginas) {}
  public static criar(caso: ListarPaginas) { return new ListarPaginasRota(caso); }
  public getCaminho() { return "/pagina"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, leituraAutenticadaRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ usuarioId: req.usuario!.id }));
    });
  }
}

export class BuscarPaginaRota implements Rotas {
  private constructor(private readonly caso: BuscarPagina) {}
  public static criar(caso: BuscarPagina) { return new BuscarPaginaRota(caso); }
  public getCaminho() { return "/pagina/:paginaId"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, leituraAutenticadaRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ paginaId: String(req.params.paginaId), usuarioId: req.usuario!.id }));
    });
  }
}

export class AtualizarPaginaRota implements Rotas {
  private constructor(private readonly caso: AtualizarPagina) {}
  public static criar(caso: AtualizarPagina) { return new AtualizarPaginaRota(caso); }
  public getCaminho() { return "/pagina/:paginaId"; }
  public getMetodo() { return HttpMethod.PUT; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, mutationRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(atualizarPaginaSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar({ ...dados, paginaId: String(req.params.paginaId), usuarioId: req.usuario!.id }));
    });
  }
}

export class PublicarPaginaRota implements Rotas {
  private constructor(private readonly caso: PublicarPagina) {}
  public static criar(caso: PublicarPagina) { return new PublicarPaginaRota(caso); }
  public getCaminho() { return "/pagina/:paginaId/publicar"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, mutationRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(publicarPaginaSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar({
        paginaId: String(req.params.paginaId),
        usuarioId: req.usuario!.id,
        publicada: dados.publicada,
      }));
    });
  }
}

export class ExcluirPaginaRota implements Rotas {
  private constructor(private readonly caso: ExcluirPagina) {}
  public static criar(caso: ExcluirPagina) { return new ExcluirPaginaRota(caso); }
  public getCaminho() { return "/pagina/:paginaId"; }
  public getMetodo() { return HttpMethod.DELETE; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, mutationRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ paginaId: String(req.params.paginaId), usuarioId: req.usuario!.id }));
    });
  }
}

export class BuscarPaginaPublicaRota implements Rotas {
  private constructor(private readonly caso: BuscarPaginaPublica) {}
  public static criar(caso: BuscarPaginaPublica) { return new BuscarPaginaPublicaRota(caso); }
  public getCaminho() { return "/p/:slug"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [publicReadRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ slug: String(req.params.slug) }));
    });
  }
}

export class RegistrarEventoPaginaRota implements Rotas {
  private constructor(private readonly caso: RegistrarEventoPagina) {}
  public static criar(caso: RegistrarEventoPagina) { return new RegistrarEventoPaginaRota(caso); }
  public getCaminho() { return "/p/:slug/evento"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [publicReadRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(eventoPaginaSchema, req.body, res);
      if (!dados) return;
      res.status(202).json(await this.caso.executar({ ...dados, slug: String(req.params.slug) }));
    });
  }
}

export class ObterAnalyticsPaginaRota implements Rotas {
  private constructor(private readonly caso: ObterAnalyticsPagina) {}
  public static criar(caso: ObterAnalyticsPagina) { return new ObterAnalyticsPaginaRota(caso); }
  public getCaminho() { return "/pagina/:paginaId/analytics"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, leituraAutenticadaRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ paginaId: String(req.params.paginaId), usuarioId: req.usuario!.id }));
    });
  }
}
