import { assertJwtConfig, resetJwtKeyCache, signToken, verifyToken } from "../../src/helpers/jwt";
import { requestIdMiddleware } from "../../src/middlewares/express/requestId";

describe("jwt config e requestId", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    resetJwtKeyCache();
  });

  it("aceita par base64", () => {
    const { generateKeyPairSync } = require("crypto");
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    process.env.JWT_PRIVATE_KEY_BASE64 = Buffer.from(privateKey.export({ type: "pkcs1", format: "pem" })).toString("base64");
    process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from(publicKey.export({ type: "pkcs1", format: "pem" })).toString("base64");
    delete process.env.JWT_SSM_PRIVATE_KEY_PARAM;
    delete process.env.JWT_SSM_PUBLIC_KEY_PARAM;
    assertJwtConfig();
    const token = signToken({ id: "1", email: "a@a.com", nome: "A", role: "user" }, "10m")!;
    expect(verifyToken(token)?.id).toBe("1");
  });

  it("rejeita par incompleto", () => {
    process.env.JWT_PRIVATE_KEY_BASE64 = "abc";
    delete process.env.JWT_PUBLIC_KEY_BASE64;
    delete process.env.JWT_SSM_PRIVATE_KEY_PARAM;
    delete process.env.JWT_SSM_PUBLIC_KEY_PARAM;
    delete process.env.JWT_SECRET;
    expect(() => assertJwtConfig()).toThrow(/par completo/);
  });

  it("requestId cria header", () => {
    const req = { headers: {} } as { headers: Record<string, string>; requestId?: string; log?: unknown };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();
    requestIdMiddleware(req as never, res as never, next);
    expect(req.requestId).toBeTruthy();
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", req.requestId);
    expect(next).toHaveBeenCalled();
  });
});
