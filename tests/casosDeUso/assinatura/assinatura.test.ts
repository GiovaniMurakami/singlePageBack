import { Usuario } from "../../../src/dominio/entidade/usuario";
import { ListarPlanos } from "../../../src/casosDeUso/assinatura/listarPlanos";
import { CriarCheckout } from "../../../src/casosDeUso/assinatura/criarCheckout";
import { CriarPortal } from "../../../src/casosDeUso/assinatura/criarPortal";
import { ProcessarWebhook } from "../../../src/casosDeUso/assinatura/processarWebhook";
import { criarMockStripeGateway, criarMockUsuarioGateway } from "../../mocks/gateways";

describe("assinatura", () => {
  it("lista planos publicos", async () => {
    const planos = await ListarPlanos.criar().executar();
    expect(planos.map((p) => p.codigo)).toEqual(["free", "pro", "ultra"]);
  });

  it("cria checkout e persiste customer", async () => {
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    const usuarioGateway = criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) });
    const stripe = criarMockStripeGateway();
    const resultado = await CriarCheckout.criar(usuarioGateway, stripe).executar({
      usuarioId: usuario.id,
      plano: "pro",
    });
    expect(resultado.url).toContain("checkout");
    expect(usuarioGateway.atualizar).toHaveBeenCalled();
  });

  it("checkout exige usuario", async () => {
    await expect(
      CriarCheckout.criar(criarMockUsuarioGateway(), criarMockStripeGateway()).executar({
        usuarioId: "x",
        plano: "pro",
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("portal exige customer stripe", async () => {
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    await expect(
      CriarPortal.criar(
        criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) }),
        criarMockStripeGateway()
      ).executar({ usuarioId: usuario.id })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("abre portal quando ha customer", async () => {
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    usuario.stripeCustomerId = "cus_1";
    const resultado = await CriarPortal.criar(
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) }),
      criarMockStripeGateway()
    ).executar({ usuarioId: usuario.id });
    expect(resultado.url).toContain("portal");
  });

  it("processa webhook e atualiza plano", async () => {
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    const usuarioGateway = criarMockUsuarioGateway({
      buscarPorId: jest.fn().mockResolvedValue(usuario),
    });
    const stripe = criarMockStripeGateway({
      construirEvento: jest.fn().mockReturnValue({
        tipo: "checkout.completed",
        customerId: "cus_1",
        usuarioId: usuario.id,
        subscriptionId: "sub_1",
        plano: "pro",
        status: "ativa",
      }),
    });
    const resultado = await ProcessarWebhook.criar(usuarioGateway, stripe).executar({
      payload: Buffer.from("{}"),
      assinatura: "sig",
    });
    expect(resultado.ok).toBe(true);
    expect(usuario.plano).toBe("pro");
    expect(usuarioGateway.atualizar).toHaveBeenCalled();
  });

  it("webhook invalido", async () => {
    await expect(
      ProcessarWebhook.criar(
        criarMockUsuarioGateway(),
        criarMockStripeGateway({ construirEvento: jest.fn(() => { throw new Error("bad"); }) })
      ).executar({ payload: Buffer.from("{}"), assinatura: "x" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("evento ignorado ou sem usuario nao falha", async () => {
    const okIgnorado = await ProcessarWebhook.criar(
      criarMockUsuarioGateway(),
      criarMockStripeGateway()
    ).executar({ payload: Buffer.from("{}"), assinatura: "s" });
    expect(okIgnorado.ok).toBe(true);

    const okSemUser = await ProcessarWebhook.criar(
      criarMockUsuarioGateway(),
      criarMockStripeGateway({
        construirEvento: jest.fn().mockReturnValue({
          tipo: "subscription.updated",
          customerId: "cus_x",
          subscriptionId: "sub",
          plano: "pro",
          status: "ativa",
        }),
      })
    ).executar({ payload: Buffer.from("{}"), assinatura: "s" });
    expect(okSemUser.ok).toBe(true);
  });
});
