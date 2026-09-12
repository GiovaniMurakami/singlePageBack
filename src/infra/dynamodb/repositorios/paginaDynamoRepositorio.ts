import type { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { Pagina } from "../../../dominio/entidade/pagina";
import { PaginaGateway, SlugPaginaJaExisteErro } from "../../../dominio/gateway/paginaGateway";
import { BaseDynamoRepositorio } from "./baseDynamoRepositorio";

type PaginaItem = {
  id: string;
  usuarioId: string;
  titulo: string;
  slug: string;
  publicada: boolean;
  tema: Pagina["tema"];
  blocos: Pagina["blocos"];
  publicadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export class PaginaDynamoRepositorio extends BaseDynamoRepositorio implements PaginaGateway {
  private constructor() {
    super();
  }

  public static criar() {
    return new PaginaDynamoRepositorio();
  }

  private paginaParaItem(pagina: Pagina): PaginaItem {
    return {
      id: pagina.id,
      usuarioId: pagina.usuarioId,
      titulo: pagina.titulo,
      slug: pagina.slug,
      publicada: pagina.publicada,
      tema: pagina.tema,
      blocos: pagina.blocos,
      publicadoEm: pagina.publicadoEm ? pagina.publicadoEm.toISOString() : null,
      criadoEm: pagina.criadoEm.toISOString(),
      atualizadoEm: pagina.atualizadoEm.toISOString(),
    };
  }

  private itemParaPagina(item: PaginaItem): Pagina {
    return new Pagina({
      ...item,
      publicadoEm: item.publicadoEm ? new Date(item.publicadoEm) : null,
      criadoEm: new Date(item.criadoEm),
      atualizadoEm: new Date(item.atualizadoEm),
    });
  }

  public async salvar(pagina: Pagina): Promise<void> {
    const item = this.paginaParaItem(pagina);
    try {
      await this.transactWrite([
        { Put: { TableName: this.tabela, Item: this.itemJson(`PAGE#${pagina.id}`, "DATA", item, { entity: "PAGE" }) } },
        { Put: { TableName: this.tabela, Item: this.itemJson(`USER#${pagina.usuarioId}`, `PAGE#${pagina.id}`, item, { entity: "USER_PAGE_INDEX" }) } },
        {
          Put: {
            TableName: this.tabela,
            Item: this.itemJson(`PAGE_SLUG#${pagina.slug}`, "DATA", { id: pagina.id, slug: pagina.slug }, { entity: "PAGE_SLUG_INDEX" }),
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
      ]);
    } catch (error) {
      if ((error as { name?: string }).name === "TransactionCanceledException") {
        throw new SlugPaginaJaExisteErro();
      }
      throw error;
    }
  }

  public async buscarPorId(id: string): Promise<Pagina | null> {
    const item = await this.getJson<PaginaItem>(`PAGE#${id}`, "DATA");
    return item ? this.itemParaPagina(item) : null;
  }

  public async buscarPorSlug(slug: string): Promise<Pagina | null> {
    const indice = await this.getJson<{ id: string }>(`PAGE_SLUG#${slug}`, "DATA");
    if (!indice) return null;
    return this.buscarPorId(indice.id);
  }

  public async listarPorUsuario(usuarioId: string): Promise<Pagina[]> {
    const itens = await this.queryJson<PaginaItem>(`USER#${usuarioId}`);
    return itens
      .filter((item) => item.id && item.slug)
      .map((item) => this.itemParaPagina(item));
  }

  public async contarPorUsuario(usuarioId: string): Promise<number> {
    const paginas = await this.listarPorUsuario(usuarioId);
    return paginas.length;
  }

  public async atualizar(pagina: Pagina, slugAnterior?: string): Promise<void> {
    const item = this.paginaParaItem(pagina);
    const ops: TransactWriteItem[] = [
      { Put: { TableName: this.tabela, Item: this.itemJson(`PAGE#${pagina.id}`, "DATA", item, { entity: "PAGE" }) } },
      { Put: { TableName: this.tabela, Item: this.itemJson(`USER#${pagina.usuarioId}`, `PAGE#${pagina.id}`, item, { entity: "USER_PAGE_INDEX" }) } },
    ];

    if (slugAnterior && slugAnterior !== pagina.slug) {
      ops.push({
        Delete: {
          TableName: this.tabela,
          Key: {
            pk: { S: `PAGE_SLUG#${slugAnterior}` },
            sk: { S: "DATA" },
          },
        },
      });
      ops.push({
        Put: {
          TableName: this.tabela,
          Item: this.itemJson(`PAGE_SLUG#${pagina.slug}`, "DATA", { id: pagina.id, slug: pagina.slug }, { entity: "PAGE_SLUG_INDEX" }),
          ConditionExpression: "attribute_not_exists(pk)",
        },
      });
    }

    try {
      await this.transactWrite(ops);
    } catch (error) {
      if ((error as { name?: string }).name === "TransactionCanceledException") {
        throw new SlugPaginaJaExisteErro();
      }
      throw error;
    }
  }

  public async excluir(pagina: Pagina): Promise<void> {
    await this.transactWriteRequests([
      this.toDeleteRequest(`PAGE#${pagina.id}`, "DATA"),
      this.toDeleteRequest(`USER#${pagina.usuarioId}`, `PAGE#${pagina.id}`),
      this.toDeleteRequest(`PAGE_SLUG#${pagina.slug}`, "DATA"),
    ]);
  }
}
