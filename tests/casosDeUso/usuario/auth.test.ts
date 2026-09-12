import bcrypt from "bcryptjs";
import { Usuario } from "../../../src/dominio/entidade/usuario";
import { EmailUsuarioJaExisteErro } from "../../../src/dominio/gateway/usuarioGateway";
import { CadastrarUsuario } from "../../../src/casosDeUso/usuario/cadastrarUsuario";
import { LoginUsuario } from "../../../src/casosDeUso/usuario/loginUsuario";
import { RefreshToken } from "../../../src/casosDeUso/usuario/refreshToken";
import { LogoutUsuario } from "../../../src/casosDeUso/usuario/logoutUsuario";
import { BuscarPerfil } from "../../../src/casosDeUso/usuario/buscarPerfil";
import { signToken } from "../../../src/helpers/jwt";
import {
  criarMockRefreshTokenGateway,
  criarMockTokenBlacklistGateway,
  criarMockUsuarioGateway,
} from "../../mocks/gateways";

describe("auth", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "segredo-teste-unitario";
  });

  it("cadastra usuario e devolve sessao", async () => {
    const usuarioGateway = criarMockUsuarioGateway();
    const refresh = criarMockRefreshTokenGateway();
    const caso = CadastrarUsuario.criar(usuarioGateway, refresh);

    const resultado = await caso.executar({
      nome: "Ana",
      email: "ana@example.com",
      senha: "senha1234",
    });

    expect(resultado.usuario.email).toBe("ana@example.com");
    expect(resultado.token).toBeTruthy();
    expect(resultado.refreshToken).toBeTruthy();
    expect(usuarioGateway.salvar).toHaveBeenCalled();
  });

  it("nao revela se o e-mail ja existe", async () => {
    const usuarioGateway = criarMockUsuarioGateway({
      buscarPorEmail: jest.fn().mockResolvedValue(Usuario.criar({ nome: "A", email: "a@a.com", senha: "x" })),
    });
    await expect(
      CadastrarUsuario.criar(usuarioGateway, criarMockRefreshTokenGateway()).executar({
        nome: "Ana",
        email: "a@a.com",
        senha: "senha1234",
      })
    ).rejects.toMatchObject({ status: 400, message: "Não foi possível concluir o cadastro." });
  });

  it("trata conflito atomico de e-mail", async () => {
    const usuarioGateway = criarMockUsuarioGateway({
      salvar: jest.fn().mockRejectedValue(new EmailUsuarioJaExisteErro()),
    });
    await expect(
      CadastrarUsuario.criar(usuarioGateway, criarMockRefreshTokenGateway()).executar({
        nome: "Ana",
        email: "ana@example.com",
        senha: "senha1234",
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("faz login com senha correta", async () => {
    const senha = await bcrypt.hash("senha1234", 4);
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha });
    const caso = LoginUsuario.criar(
      criarMockUsuarioGateway({ buscarPorEmail: jest.fn().mockResolvedValue(usuario) }),
      criarMockRefreshTokenGateway()
    );
    const resultado = await caso.executar({ email: "ana@example.com", senha: "senha1234" });
    expect(resultado.usuario.nome).toBe("Ana");
  });

  it("rejeita senha invalida", async () => {
    const senha = await bcrypt.hash("senha1234", 4);
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha });
    await expect(
      LoginUsuario.criar(
        criarMockUsuarioGateway({ buscarPorEmail: jest.fn().mockResolvedValue(usuario) }),
        criarMockRefreshTokenGateway()
      ).executar({ email: "ana@example.com", senha: "errada" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("renova sessao com refresh valido", async () => {
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    const caso = RefreshToken.criar(
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) }),
      criarMockRefreshTokenGateway({
        consumir: jest.fn().mockResolvedValue({ token: "r", usuarioId: usuario.id, expiresAt: new Date(Date.now() + 1000) }),
      })
    );
    const resultado = await caso.executar({ refreshToken: "refresh-valido" });
    expect(resultado.token).toBeTruthy();
  });

  it("rejeita refresh invalido", async () => {
    await expect(
      RefreshToken.criar(criarMockUsuarioGateway(), criarMockRefreshTokenGateway()).executar({ refreshToken: "x" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rejeita refresh de usuario inexistente", async () => {
    await expect(
      RefreshToken.criar(
        criarMockUsuarioGateway(),
        criarMockRefreshTokenGateway({
          consumir: jest.fn().mockResolvedValue({ token: "r", usuarioId: "u1", expiresAt: new Date(Date.now() + 1000) }),
        })
      ).executar({ refreshToken: "r" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("faz logout e invalida tokens", async () => {
    const token = signToken({ id: "1", email: "a@a.com", nome: "A", role: "user" }, "30m")!;
    const blacklist = criarMockTokenBlacklistGateway();
    const refresh = criarMockRefreshTokenGateway();
    const resultado = await LogoutUsuario.criar(refresh, blacklist).executar({
      accessToken: token,
      refreshToken: "r1",
      usuarioId: "1",
    });
    expect(resultado.ok).toBe(true);
    expect(blacklist.adicionar).toHaveBeenCalled();
    expect(refresh.consumir).toHaveBeenCalledWith("r1");
  });

  it("logout sem refresh remove todos os tokens do usuario", async () => {
    const blacklist = criarMockTokenBlacklistGateway();
    const refresh = criarMockRefreshTokenGateway();
    await LogoutUsuario.criar(refresh, blacklist).executar({
      accessToken: "token",
      usuarioId: "1",
    });
    expect(refresh.excluirPorUsuario).toHaveBeenCalledWith("1");
  });

  it("busca perfil", async () => {
    const usuario = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    const perfil = await BuscarPerfil.criar(
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) })
    ).executar({ usuarioId: usuario.id });
    expect(perfil.plano).toBe("free");
  });

  it("perfil inexistente", async () => {
    await expect(
      BuscarPerfil.criar(criarMockUsuarioGateway()).executar({ usuarioId: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });
});
