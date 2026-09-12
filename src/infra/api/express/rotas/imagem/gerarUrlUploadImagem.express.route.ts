import { RequestHandler } from "express";
import { GerarUrlUploadImagem } from "../../../../../casosDeUso/imagem/gerarUrlUploadImagem";
import { HttpMethod, Rotas, handlerErro } from "../rotas";
import { autenticarJwt } from "../../../../../middlewares/express/autenticarJwt";
import { uploadImagemRateLimiter } from "../../../../../middlewares/express/rateLimiter";
import { uploadImagemSchema } from "../../../../../helpers/validacao/schemas";
import { validarBody } from "../../../../../helpers/validacao/validarBody";

export class GerarUrlUploadImagemRota implements Rotas {
  private constructor(private readonly caso: GerarUrlUploadImagem) {}
  public static criar(caso: GerarUrlUploadImagem) { return new GerarUrlUploadImagemRota(caso); }
  public getCaminho() { return "/imagem/upload-url"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, uploadImagemRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(uploadImagemSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar({ ...dados, usuarioId: req.usuario!.id }));
    });
  }
}
