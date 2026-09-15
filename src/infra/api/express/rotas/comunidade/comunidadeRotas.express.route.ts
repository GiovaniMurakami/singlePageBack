import { RequestHandler } from "express";
import { ListarComunidade } from "../../../../../casosDeUso/comunidade/listarComunidade";
import { AlternarCurtida } from "../../../../../casosDeUso/comunidade/alternarCurtida";
import { HttpMethod, Rotas, handlerErro } from "../rotas";
import { autenticarJwt } from "../../../../../middlewares/express/autenticarJwt";
import { autenticarJwtOpcional } from "../../../../../middlewares/express/autenticarJwtOpcional";
import { mutationRateLimiter, publicReadRateLimiter } from "../../../../../middlewares/express/rateLimiter";

export class ListarComunidadeRota implements Rotas {
  private constructor(private readonly caso: ListarComunidade) {}
  public static criar(caso: ListarComunidade) { return new ListarComunidadeRota(caso); }
  public getCaminho() { return "/comunidade"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwtOpcional, publicReadRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ usuarioId: req.usuario?.id }));
    });
  }
}

export class AlternarCurtidaRota implements Rotas {
  private constructor(private readonly caso: AlternarCurtida) {}
  public static criar(caso: AlternarCurtida) { return new AlternarCurtidaRota(caso); }
  public getCaminho() { return "/comunidade/:paginaId/curtida"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, mutationRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({
        paginaId: String(req.params.paginaId),
        usuarioId: req.usuario!.id,
      }));
    });
  }
}
