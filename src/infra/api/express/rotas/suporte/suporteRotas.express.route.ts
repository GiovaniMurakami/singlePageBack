import { RequestHandler } from "express";
import { EnviarPedidoAjuda } from "../../../../../casosDeUso/suporte/enviarPedidoAjuda";
import { HttpMethod, Rotas, handlerErro } from "../rotas";
import { authRateLimiter } from "../../../../../middlewares/express/rateLimiter";
import { pedidoAjudaSchema } from "../../../../../helpers/validacao/schemas";
import { validarBody } from "../../../../../helpers/validacao/validarBody";

export class EnviarPedidoAjudaRota implements Rotas {
  private constructor(private readonly caso: EnviarPedidoAjuda) {}
  public static criar(caso: EnviarPedidoAjuda) { return new EnviarPedidoAjudaRota(caso); }
  public getCaminho() { return "/suporte"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [authRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(pedidoAjudaSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar(dados));
    });
  }
}
