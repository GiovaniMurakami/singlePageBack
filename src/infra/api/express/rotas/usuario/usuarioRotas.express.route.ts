import { RequestHandler } from "express";
import { CadastrarUsuario } from "../../../../../casosDeUso/usuario/cadastrarUsuario";
import { LoginUsuario } from "../../../../../casosDeUso/usuario/loginUsuario";
import { RefreshToken } from "../../../../../casosDeUso/usuario/refreshToken";
import { LogoutUsuario } from "../../../../../casosDeUso/usuario/logoutUsuario";
import { BuscarPerfil } from "../../../../../casosDeUso/usuario/buscarPerfil";
import { HttpMethod, Rotas, handlerErro } from "../rotas";
import { autenticarJwt } from "../../../../../middlewares/express/autenticarJwt";
import { authRateLimiter, leituraAutenticadaRateLimiter, mutationRateLimiter, refreshTokenRateLimiter } from "../../../../../middlewares/express/rateLimiter";
import { cadastrarUsuarioSchema, loginUsuarioSchema, refreshTokenSchema } from "../../../../../helpers/validacao/schemas";
import { validarBody } from "../../../../../helpers/validacao/validarBody";

export class CadastrarUsuarioRota implements Rotas {
  private constructor(private readonly caso: CadastrarUsuario) {}
  public static criar(caso: CadastrarUsuario) { return new CadastrarUsuarioRota(caso); }
  public getCaminho() { return "/usuario/cadastrar"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [authRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(cadastrarUsuarioSchema, req.body, res);
      if (!dados) return;
      res.status(201).json(await this.caso.executar(dados));
    });
  }
}

export class LoginUsuarioRota implements Rotas {
  private constructor(private readonly caso: LoginUsuario) {}
  public static criar(caso: LoginUsuario) { return new LoginUsuarioRota(caso); }
  public getCaminho() { return "/usuario/login"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [authRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(loginUsuarioSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar(dados));
    });
  }
}

export class RefreshTokenRota implements Rotas {
  private constructor(private readonly caso: RefreshToken) {}
  public static criar(caso: RefreshToken) { return new RefreshTokenRota(caso); }
  public getCaminho() { return "/usuario/refresh-token"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [refreshTokenRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const dados = validarBody(refreshTokenSchema, req.body, res);
      if (!dados) return;
      res.json(await this.caso.executar(dados));
    });
  }
}

export class LogoutUsuarioRota implements Rotas {
  private constructor(private readonly caso: LogoutUsuario) {}
  public static criar(caso: LogoutUsuario) { return new LogoutUsuarioRota(caso); }
  public getCaminho() { return "/usuario/logout"; }
  public getMetodo() { return HttpMethod.POST; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, mutationRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      const token = req.headers.authorization?.replace("Bearer ", "") || "";
      res.json(await this.caso.executar({
        accessToken: token,
        refreshToken: req.body?.refreshToken,
        usuarioId: req.usuario!.id,
      }));
    });
  }
}

export class BuscarPerfilRota implements Rotas {
  private constructor(private readonly caso: BuscarPerfil) {}
  public static criar(caso: BuscarPerfil) { return new BuscarPerfilRota(caso); }
  public getCaminho() { return "/usuario/perfil"; }
  public getMetodo() { return HttpMethod.GET; }
  public getMiddlewares(): RequestHandler[] { return [autenticarJwt, leituraAutenticadaRateLimiter]; }
  public getHandler() {
    return handlerErro(async (req, res) => {
      res.json(await this.caso.executar({ usuarioId: req.usuario!.id }));
    });
  }
}
