import { Usuario } from "../../../src/dominio/entidade/usuario";
import { Pagina, criarBloco } from "../../../src/dominio/entidade/pagina";
import { SlugPaginaJaExisteErro } from "../../../src/dominio/gateway/paginaGateway";
import { CriarPagina } from "../../../src/casosDeUso/pagina/criarPagina";
import { ListarPaginas } from "../../../src/casosDeUso/pagina/listarPaginas";
import { BuscarPagina } from "../../../src/casosDeUso/pagina/buscarPagina";
import { AtualizarPagina } from "../../../src/casosDeUso/pagina/atualizarPagina";
import { PublicarPagina } from "../../../src/casosDeUso/pagina/publicarPagina";
import { ExcluirPagina } from "../../../src/casosDeUso/pagina/excluirPagina";
import { BuscarPaginaPublica } from "../../../src/casosDeUso/pagina/buscarPaginaPublica";
import { criarMockPaginaGateway, criarMockUsuarioGateway, criarMockEmailGateway } from "../../mocks/gateways";

function usuarioFree() {
  return Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
}

function paginaDe(usuarioId: string, extras: Partial<ConstructorParameters<typeof Pagina>[0]> = {}) {
  return Pagina.criar({ usuarioId, titulo: "Meu site", slug: "meu-site", ...extras });
}

describe("pagina", () => {
  it("cria pagina no plano free", async () => {
    const usuario = usuarioFree();
    const caso = CriarPagina.criar(
      criarMockPaginaGateway(),
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) })
    );
    const criada = await caso.executar({ usuarioId: usuario.id, titulo: "Studio", slug: "studio" });
    expect(criada.slug).toBe("studio");
    expect(criada.publicada).toBe(false);
  });

  it("bloqueia segunda pagina no plano free", async () => {
    const usuario = usuarioFree();
    await expect(
      CriarPagina.criar(
        criarMockPaginaGateway({ contarPorUsuario: jest.fn().mockResolvedValue(1) }),
        criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) })
      ).executar({ usuarioId: usuario.id, titulo: "Dois", slug: "dois" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejeita slug duplicado", async () => {
    const usuario = usuarioFree();
    await expect(
      CriarPagina.criar(
        criarMockPaginaGateway({ salvar: jest.fn().mockRejectedValue(new SlugPaginaJaExisteErro()) }),
        criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) })
      ).executar({ usuarioId: usuario.id, titulo: "A", slug: "a" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("nao cria pagina para usuario inexistente", async () => {
    await expect(
      CriarPagina.criar(criarMockPaginaGateway(), criarMockUsuarioGateway()).executar({
        usuarioId: "x",
        titulo: "A",
        slug: "a",
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("lista, busca, atualiza e exclui", async () => {
    const pagina = paginaDe("u1");
    const gateway = criarMockPaginaGateway({
      listarPorUsuario: jest.fn().mockResolvedValue([pagina]),
      buscarPorId: jest.fn().mockResolvedValue(pagina),
    });

    const lista = await ListarPaginas.criar(gateway).executar({ usuarioId: "u1" });
    expect(lista[0].slug).toBe("meu-site");

    const detalhe = await BuscarPagina.criar(gateway).executar({ paginaId: pagina.id, usuarioId: "u1" });
    expect(detalhe.titulo).toBe("Meu site");

    const atualizada = await AtualizarPagina.criar(gateway).executar({
      paginaId: pagina.id,
      usuarioId: "u1",
      titulo: "Novo",
      slug: "novo",
    });
    expect(atualizada.titulo).toBe("Novo");

    await expect(BuscarPagina.criar(gateway).executar({ paginaId: pagina.id, usuarioId: "outro" }))
      .rejects.toMatchObject({ status: 404 });

    const exclusao = await ExcluirPagina.criar(gateway).executar({ paginaId: pagina.id, usuarioId: "u1" });
    expect(exclusao.ok).toBe(true);
  });

  it("atualizar pagina inexistente ou slug em uso", async () => {
    await expect(
      AtualizarPagina.criar(criarMockPaginaGateway()).executar({ paginaId: "x", usuarioId: "u1" })
    ).rejects.toMatchObject({ status: 404 });

    const pagina = paginaDe("u1");
    await expect(
      AtualizarPagina.criar(
        criarMockPaginaGateway({
          buscarPorId: jest.fn().mockResolvedValue(pagina),
          atualizar: jest.fn().mockRejectedValue(new SlugPaginaJaExisteErro()),
        })
      ).executar({ paginaId: pagina.id, usuarioId: "u1", slug: "ocupado" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("nao publica pagina vazia", async () => {
    const pagina = paginaDe("u1");
    await expect(
      PublicarPagina.criar(
        criarMockPaginaGateway({ buscarPorId: jest.fn().mockResolvedValue(pagina) }),
        criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuarioFree()) }),
        criarMockEmailGateway()
      ).executar({ paginaId: pagina.id, usuarioId: "u1", publicada: true })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("nao publica se o dono sumiu", async () => {
    const pagina = paginaDe("u1", { blocos: [criarBloco("texto", { corpo: "oi" })] });
    await expect(
      PublicarPagina.criar(
        criarMockPaginaGateway({ buscarPorId: jest.fn().mockResolvedValue(pagina) }),
        criarMockUsuarioGateway(),
        criarMockEmailGateway()
      ).executar({ paginaId: pagina.id, usuarioId: "u1", publicada: true })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("publica e despublica", async () => {
    const usuario = usuarioFree();
    const pagina = paginaDe(usuario.id, { blocos: [criarBloco("texto", { corpo: "oi" })] });
    const gateway = criarMockPaginaGateway({
      buscarPorId: jest.fn().mockResolvedValue(pagina),
      listarPorUsuario: jest.fn().mockResolvedValue([pagina]),
    });
    const publicada = await PublicarPagina.criar(
      gateway,
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) }),
      criarMockEmailGateway()
    ).executar({ paginaId: pagina.id, usuarioId: usuario.id, publicada: true });
    expect(publicada.publicada).toBe(true);

    const rascunho = await PublicarPagina.criar(
      gateway,
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) }),
      criarMockEmailGateway()
    ).executar({ paginaId: pagina.id, usuarioId: usuario.id, publicada: false });
    expect(rascunho.publicada).toBe(false);
  });

  it("pagina publica so aparece se publicada", async () => {
    const usuario = usuarioFree();
    const pagina = paginaDe(usuario.id, { blocos: [criarBloco("capa", { titulo: "Oi" })] });
    pagina.publicada = true;

    const publica = await BuscarPaginaPublica.criar(
      criarMockPaginaGateway({ buscarPorSlug: jest.fn().mockResolvedValue(pagina) }),
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(usuario) })
    ).executar({ slug: "meu-site" });
    expect(publica.marca).toBe(true);
    expect(publica.anuncios).toBe(true);

    await expect(
      BuscarPaginaPublica.criar(criarMockPaginaGateway(), criarMockUsuarioGateway()).executar({ slug: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("excluir pagina de outro usuario falha", async () => {
    const pagina = paginaDe("u1");
    await expect(
      ExcluirPagina.criar(criarMockPaginaGateway({ buscarPorId: jest.fn().mockResolvedValue(pagina) }))
        .executar({ paginaId: pagina.id, usuarioId: "u2" })
    ).rejects.toMatchObject({ status: 404 });
  });
});
