import { autenticarJwt, inicializarAutenticarJwt } from "../../src/middlewares/express/autenticarJwt";
import { signToken, resetJwtKeyCache } from "../../src/helpers/jwt";
import { sanitizarEntrada } from "../../src/middlewares/express/sanitizarEntrada";
import { criarMockTokenBlacklistGateway } from "../mocks/gateways";

function mockReqRes(headers: Record<string, string> = {}, extras: Record<string, unknown> = {}) {
  const req = { headers, ...extras } as never;
  const res = {
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
  const next = jest.fn();
  return { req, res, next };
}

describe("middlewares", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "segredo-teste-unitario";
    resetJwtKeyCache();
    inicializarAutenticarJwt(criarMockTokenBlacklistGateway());
  });

  it("exige token", async () => {
    const { req, res, next } = mockReqRes();
    await autenticarJwt(req as never, res as never, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita token invalido", async () => {
    const { req, res, next } = mockReqRes({ authorization: "Bearer abc" });
    await autenticarJwt(req as never, res as never, next);
    expect(res.statusCode).toBe(401);
  });

  it("aceita token valido", async () => {
    const token = signToken({ id: "1", email: "a@a.com", nome: "A", role: "user" }, "30m")!;
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await autenticarJwt(req as never, res as never, next);
    expect(next).toHaveBeenCalled();
    expect((req as { usuario?: { id: string } }).usuario?.id).toBe("1");
  });

  it("rejeita token na blacklist", async () => {
    inicializarAutenticarJwt(criarMockTokenBlacklistGateway({ existe: jest.fn().mockResolvedValue(true) }));
    const token = signToken({ id: "1", email: "a@a.com", nome: "A", role: "user" }, "30m")!;
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await autenticarJwt(req as never, res as never, next);
    expect(res.statusCode).toBe(401);
  });

  it("sanitiza html e ignora webhook", () => {
    const next = jest.fn();
    const req = {
      path: "/pagina",
      body: { titulo: "<b>Oi</b>" },
      query: { q: "<x>" },
      params: { id: "1" },
    };
    sanitizarEntrada(req as never, {} as never, next);
    expect(req.body.titulo).toBe("Oi");
    expect(next).toHaveBeenCalled();

    const webhook = { path: "/assinatura/webhook", body: { html: "<b>x</b>" } };
    sanitizarEntrada(webhook as never, {} as never, next);
    expect(webhook.body.html).toBe("<b>x</b>");
  });
});
