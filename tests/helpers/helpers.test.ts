import { ErroPersonalizado } from "../../src/helpers/error/ErroPersonalizado";
import { hashToken } from "../../src/helpers/tokenHash";
import { listarPlanosPublicos, obterPlano, planoAtivoDeAssinatura } from "../../src/helpers/planos";
import { getCorsOrigins, getFrontendUrl, getS3BaseUrl, getStripePriceId, isExecucaoLocal } from "../../src/helpers/env";
import { assertJwtConfig, resetJwtKeyCache, signToken, verifyToken, decodificarExpiracao } from "../../src/helpers/jwt";
import { validarBody } from "../../src/helpers/validacao/validarBody";
import { cadastrarUsuarioSchema } from "../../src/helpers/validacao/schemas";
import { Usuario } from "../../src/dominio/entidade/usuario";
import { Pagina, criarBloco, TEMA_PADRAO } from "../../src/dominio/entidade/pagina";

function mockResponse() {
  return {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

describe("helpers e entidades", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "segredo-teste-unitario";
    resetJwtKeyCache();
  });

  it("ErroPersonalizado e hashToken", () => {
    const erro = ErroPersonalizado.criar({ mensagem: "x", status: 400, erros: ["a"] });
    expect(erro.status).toBe(400);
    expect(hashToken("abc")).toHaveLength(64);
  });

  it("planos", () => {
    expect(obterPlano("pro").paginasMaximas).toBe(10);
    expect(obterPlano("outro").codigo).toBe("free");
    expect(planoAtivoDeAssinatura("pro", "ativa")).toBe("pro");
    expect(planoAtivoDeAssinatura("pro", "nenhuma")).toBe("pro");
    expect(planoAtivoDeAssinatura("pro", "cancelada")).toBe("free");
    expect(listarPlanosPublicos()).toHaveLength(3);
  });

  it("env", () => {
    process.env.IS_LOCAL = "true";
    process.env.FRONTEND_URL = "https://app.example.com/";
    process.env.CORS_ORIGIN = "https://a.com, https://b.com";
    process.env.AWS_S3_BUCKET = "bucket";
    process.env.AWS_S3_REGION = "us-east-1";
    process.env.STRIPE_PRICE_PRO = "price_pro";
    expect(isExecucaoLocal()).toBe(true);
    expect(getFrontendUrl()).toBe("https://app.example.com");
    expect(getCorsOrigins()).toContain("https://a.com");
    expect(getCorsOrigins()).toContain("https://b.com");
    expect(getCorsOrigins()).toContain("https://app.example.com");
    expect(getCorsOrigins()).toContain("http://localhost:5173");
    expect(getCorsOrigins()).toContain("https://localhost:5173");
    expect(getS3BaseUrl()).toContain("bucket");
    expect(getStripePriceId("pro")).toBe("price_pro");
    expect(getStripePriceId("ultra")).toBe("");
  });

  it("jwt hs256 em teste", () => {
    const token = signToken({ id: "1", email: "a@a.com", nome: "A", role: "user" }, "30m");
    expect(token).toBeTruthy();
    expect(verifyToken(token!).email).toBe("a@a.com");
    expect(decodificarExpiracao(token!)?.getTime()).toBeGreaterThan(Date.now());
    expect(verifyToken("invalido")).toBeNull();
    expect(decodificarExpiracao("abc")).toBeNull();
    assertJwtConfig();
  });

  it("validarBody", () => {
    const res = mockResponse();
    expect(validarBody(cadastrarUsuarioSchema, { nome: "A" }, res as never)).toBeNull();
    expect(res.statusCode).toBe(400);
    const ok = validarBody(
      cadastrarUsuarioSchema,
      { nome: "Ana Silva", email: "ana@example.com", senha: "senha1234" },
      mockResponse() as never
    );
    expect(ok?.email).toBe("ana@example.com");
  });

  it("entidades", () => {
    const usuario = Usuario.criar({ nome: " Ana ", email: "ANA@Ex.com", senha: "x" });
    expect(usuario.email).toBe("ana@ex.com");
    expect(usuario.planoEfetivo()).toBe("free");
    usuario.plano = "ultra";
    usuario.statusAssinatura = "ativa";
    expect(usuario.planoEfetivo()).toBe("ultra");

    const pagina = Pagina.criar({ usuarioId: usuario.id, titulo: " Site ", slug: "Site" });
    expect(pagina.tema).toMatchObject(TEMA_PADRAO);
    expect(criarBloco("capa", { titulo: "Oi" }).tipo).toBe("capa");
  });
});
