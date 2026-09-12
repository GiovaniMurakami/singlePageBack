import { RequestHandler } from "express";
import { ListarPlanos } from "../../../../../casosDeUso/assinatura/listarPlanos";
import { CriarCheckout } from "../../../../../casosDeUso/assinatura/criarCheckout";
import { CriarPortal } from "../../../../../casosDeUso/assinatura/criarPortal";
import { ProcessarWebhook } from "../../../../../casosDeUso/assinatura/processarWebhook";
import { HttpMethod, Rotas, handlerErro } from "../rotas";
import { autenticarJwt } from "../../../../../middlewares/express/autenticarJwt";
import { checkoutRateLimiter, publicReadRateLimiter } from "../../../../../middlewares/express/rateLimiter";
import { criarCheckoutSchema } from "../../../../../helpers/validacao/schemas";
import { validarBody } from "../../../../../helpers/validacao/validarBody";

export class ListarPlanosRota implements Rotas {
  private constructor(private readonly caso: ListarPlanos) {}
  public static criar(caso: ListarPlanos) { return new ListarPlanosRota(caso); }
  public getCaminho() { return "/assinatura/planos"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [publicReadRateLimiter]; }
  public getHandler() {
    return handlerErro(async (_req, res) => {
      res.json(await this.caso.executar());
    });
  }
}

export class CriarCheckoutRota implements Rotas {
  private constructor(private readonly caso: CriarCheckout) {}
  public static criar(caso: CriarCheckout) { return new CriarCheckoutRota(caso); }
  public getCaminho() { return "/assinatura/checkout"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, checkoutRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(criarCheckoutSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar({ usuarioId: req.usuario!.id, plano: dados.plano }));
    });
  }
}

export class CriarPortalRota implements Rotas {
  private constructor(private readonly caso: CriarPortal) {}
  public static criar(caso: CriarPortal) { return new CriarPortalRota(caso); }
  public getCaminho() { return "/assinatura/portal"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, checkoutRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ usuarioId: req.usuario!.id }));
    });
  }
}

export class ProcessarWebhookRota implements Rotas {
  private constructor(private readonly caso: ProcessarWebhook) {}
  public static criar(caso: ProcessarWebhook) { return new ProcessarWebhookRota(caso); }
  public getCaminho() { return "/assinatura/webhook"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return []; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const assinatura = String(req.headers["stripe-signature"] || "");
      const payload = req.rawBody ?? (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})));
      res.json(await this.caso.executar({ payload, assinatura }));
    });
  }
}
