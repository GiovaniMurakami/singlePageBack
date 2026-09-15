import { Usuario } from "../../../src/dominio/entidade/usuario";
import { ListarComunidade } from "../../../src/casosDeUso/comunidade/listarComunidade";
import { AlternarCurtida } from "../../../src/casosDeUso/comunidade/alternarCurtida";
import { criarMockComunidadeGateway } from "../../mocks/comunidade";
import { criarMockPaginaGateway, criarMockUsuarioGateway } from "../../mocks/gateways";
import { Pagina } from "../../../src/dominio/entidade/pagina";

describe("comunidade", () => {
  it("lista publicadas com badge hot nas mais curtidas", async () => {
    const autor = Usuario.criar({ nome: "Ana", email: "ana@example.com", senha: "x" });
    const comunidade = criarMockComunidadeGateway({
      listarPublicadas: jest.fn().mockResolvedValue([
        {
          paginaId: "p1",
          slug: "a",
          titulo: "Alpha",
          autorId: autor.id,
          temaFundo: "#111",
          temaDestaque: "#f00",
          temaTexto: "#111",
          capaUrl: null,
          previewTitulo: "Alpha",
          previewSubtitulo: "",
          previewCta: "Ver mais",
          publicadoEm: "2026-01-01T00:00:00.000Z",
          atualizadoEm: "2026-01-01T00:00:00.000Z",
        },
        {
          paginaId: "p2",
          slug: "b",
          titulo: "Beta",
          autorId: autor.id,
          temaFundo: "#222",
          temaDestaque: "#0f0",
          temaTexto: "#111",
          capaUrl: null,
          previewTitulo: "Beta",
          previewSubtitulo: "",
          previewCta: "Ver mais",
          publicadoEm: "2026-01-02T00:00:00.000Z",
          atualizadoEm: "2026-01-02T00:00:00.000Z",
        },
        {
          paginaId: "p3",
          slug: "c",
          titulo: "Gama",
          autorId: autor.id,
          temaFundo: "#333",
          temaDestaque: "#00f",
          temaTexto: "#111",
          capaUrl: null,
          previewTitulo: "Gama",
          previewSubtitulo: "",
          previewCta: "Ver mais",
          publicadoEm: "2026-01-03T00:00:00.000Z",
          atualizadoEm: "2026-01-03T00:00:00.000Z",
        },
        {
          paginaId: "p4",
          slug: "d",
          titulo: "Delta",
          autorId: autor.id,
          temaFundo: "#444",
          temaDestaque: "#ff0",
          temaTexto: "#111",
          capaUrl: null,
          previewTitulo: "Delta",
          previewSubtitulo: "",
          previewCta: "Ver mais",
          publicadoEm: "2026-01-04T00:00:00.000Z",
          atualizadoEm: "2026-01-04T00:00:00.000Z",
        },
      ]),
      obterTotaisCurtidas: jest.fn().mockResolvedValue({ p1: 10, p2: 5, p3: 3, p4: 0 }),
    });

    const { itens } = await ListarComunidade.criar(
      comunidade,
      criarMockUsuarioGateway({ buscarPorId: jest.fn().mockResolvedValue(autor) })
    ).executar({});

    expect(itens.filter((item) => item.hot).map((item) => item.paginaId)).toEqual(["p1", "p2", "p3"]);
    expect(itens[0].paginaId).toBe("p1");
    expect(itens.find((item) => item.paginaId === "p4")?.hot).toBe(false);
  });

  it("alterna curtida em pagina publicada", async () => {
    const pagina = Pagina.criar({ usuarioId: "u1", titulo: "Site", slug: "site" });
    pagina.publicada = true;
    const comunidade = criarMockComunidadeGateway({
      curtiu: jest.fn().mockResolvedValue(false),
      curtir: jest.fn().mockResolvedValue(2),
    });

    const resultado = await AlternarCurtida.criar(
      comunidade,
      criarMockPaginaGateway({ buscarPorId: jest.fn().mockResolvedValue(pagina) })
    ).executar({ paginaId: pagina.id, usuarioId: "u2" });

    expect(resultado).toEqual({ curtiu: true, curtidas: 2 });
  });

  it("nao curte pagina nao publicada", async () => {
    const pagina = Pagina.criar({ usuarioId: "u1", titulo: "Site", slug: "site" });
    await expect(
      AlternarCurtida.criar(
        criarMockComunidadeGateway(),
        criarMockPaginaGateway({ buscarPorId: jest.fn().mockResolvedValue(pagina) })
      ).executar({ paginaId: pagina.id, usuarioId: "u2" })
    ).rejects.toMatchObject({ status: 404 });
  });
});
