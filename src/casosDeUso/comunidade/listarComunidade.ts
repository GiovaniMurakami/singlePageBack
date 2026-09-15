import { ComunidadeGateway, ItemComunidade } from "../../dominio/gateway/comunidadeGateway";
import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { CasoDeUso } from "../casoDeUso";

const TOP_HOT = 3;

export type ItemComunidadeResposta = ItemComunidade & {
  hot: boolean;
  curtiu: boolean;
};

function marcarHot(itens: ItemComunidade[]): ItemComunidadeResposta[] {
  const ordenados = [...itens].sort((a, b) => b.curtidas - a.curtidas || a.titulo.localeCompare(b.titulo));
  const limiar = ordenados[TOP_HOT - 1]?.curtidas ?? Number.POSITIVE_INFINITY;
  const idsHot = new Set(
    ordenados
      .filter((item) => item.curtidas > 0 && item.curtidas >= limiar)
      .slice(0, TOP_HOT)
      .map((item) => item.paginaId)
  );

  return itens
    .map((item) => ({
      ...item,
      hot: idsHot.has(item.paginaId),
      curtiu: false,
    }))
    .sort((a, b) => {
      if (a.hot !== b.hot) return a.hot ? -1 : 1;
      if (b.curtidas !== a.curtidas) return b.curtidas - a.curtidas;
      return (b.publicadoEm || "").localeCompare(a.publicadoEm || "");
    });
}

export class ListarComunidade implements CasoDeUso<
  { usuarioId?: string },
  { itens: ItemComunidadeResposta[] }
> {
  private constructor(
    private readonly comunidadeGateway: ComunidadeGateway,
    private readonly usuarioGateway: UsuarioGateway
  ) {}

  public static criar(comunidadeGateway: ComunidadeGateway, usuarioGateway: UsuarioGateway) {
    return new ListarComunidade(comunidadeGateway, usuarioGateway);
  }

  public async executar(input: { usuarioId?: string } = {}) {
    const publicadas = await this.comunidadeGateway.listarPublicadas();
    const paginaIds = publicadas.map((item) => item.paginaId);
    const totais = await this.comunidadeGateway.obterTotaisCurtidas(paginaIds);

    const autores = new Map<string, string>();
    await Promise.all(
      [...new Set(publicadas.map((item) => item.autorId))].map(async (autorId) => {
        const usuario = await this.usuarioGateway.buscarPorId(autorId);
        autores.set(autorId, usuario?.nome?.trim() || "Alguém no Single");
      })
    );

    const base: ItemComunidade[] = publicadas.map((item) => ({
      ...item,
      autorNome: autores.get(item.autorId) || "Alguém no Single",
      curtidas: totais[item.paginaId] || 0,
    }));

    const itens = marcarHot(base);

    if (input.usuarioId) {
      const curtidas = await this.comunidadeGateway.listarCurtidasDoUsuario(input.usuarioId, paginaIds);
      for (const item of itens) {
        item.curtiu = curtidas.has(item.paginaId);
      }
    }

    return { itens };
  }
}
