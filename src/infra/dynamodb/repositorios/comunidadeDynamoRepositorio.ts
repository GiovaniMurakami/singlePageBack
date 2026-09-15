import {
  GetItemCommand,
  TransactWriteItemsCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { ComunidadeGateway } from "../../../dominio/gateway/comunidadeGateway";
import { BaseDynamoRepositorio } from "./baseDynamoRepositorio";

type PaginaItem = {
  id: string;
  usuarioId: string;
  titulo: string;
  slug: string;
  publicada: boolean;
  tema?: { fundo?: string; destaque?: string };
  blocos?: Array<{ tipo: string; props?: Record<string, unknown> }>;
  publicadoEm: string | null;
  atualizadoEm: string;
};

function extrairCapa(blocos: PaginaItem["blocos"] = []): string | null {
  for (const bloco of blocos) {
    const props = bloco.props || {};
    if (bloco.tipo === "capa") {
      const url = props.imagem || props.url || props.src;
      if (typeof url === "string" && url) return url;
    }
    if (bloco.tipo === "imagem") {
      const url = props.url || props.src || props.imagem;
      if (typeof url === "string" && url) return url;
    }
    if (bloco.tipo === "galeria") {
      const urls = props.urls;
      if (Array.isArray(urls) && typeof urls[0] === "string" && urls[0]) return urls[0];
    }
  }
  return null;
}

export class ComunidadeDynamoRepositorio extends BaseDynamoRepositorio implements ComunidadeGateway {
  private constructor() {
    super();
  }

  public static criar() {
    return new ComunidadeDynamoRepositorio();
  }

  public async listarPublicadas() {
    const itens = await this.scanEntityJson<PaginaItem>("PAGE");
    return itens
      .filter((item) => item?.publicada && item.id && item.slug)
      .map((item) => ({
        paginaId: item.id,
        slug: item.slug,
        titulo: item.titulo || "Sem título",
        autorId: item.usuarioId,
        temaFundo: item.tema?.fundo || "#f6f1ea",
        temaDestaque: item.tema?.destaque || "#c2410c",
        capaUrl: extrairCapa(item.blocos),
        publicadoEm: item.publicadoEm,
        atualizadoEm: item.atualizadoEm,
      }));
  }

  public async obterTotaisCurtidas(paginaIds: string[]): Promise<Record<string, number>> {
    const unicos = [...new Set(paginaIds.filter(Boolean))];
    const totais: Record<string, number> = {};
    await Promise.all(unicos.map(async (id) => {
      const item = await this.getItemAttrs(`PAGE#${id}`, "LIKE_META");
      totais[id] = Number(item?.total?.N || 0);
    }));
    return totais;
  }

  public async listarCurtidasDoUsuario(usuarioId: string, paginaIds: string[]): Promise<Set<string>> {
    const curtidas = new Set<string>();
    await Promise.all(paginaIds.map(async (id) => {
      if (await this.curtiu(id, usuarioId)) curtidas.add(id);
    }));
    return curtidas;
  }

  public async curtiu(paginaId: string, usuarioId: string): Promise<boolean> {
    const item = await this.getJson<Record<string, unknown>>(`PAGE#${paginaId}`, `LIKE#${usuarioId}`);
    return Boolean(item);
  }

  public async curtir(paginaId: string, usuarioId: string): Promise<number> {
    this.assertTabelaConfigurada();
    try {
      await this.cliente.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tabela,
              Item: this.itemJson(
                `PAGE#${paginaId}`,
                `LIKE#${usuarioId}`,
                { paginaId, usuarioId, criadoEm: new Date().toISOString() },
                { entity: "PAGE_LIKE" }
              ),
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          {
            Update: {
              TableName: this.tabela,
              Key: {
                pk: { S: `PAGE#${paginaId}` },
                sk: { S: "LIKE_META" },
              },
              UpdateExpression: "ADD #total :um SET entity = if_not_exists(entity, :entity), payload = if_not_exists(payload, :payload)",
              ExpressionAttributeNames: { "#total": "total" },
              ExpressionAttributeValues: {
                ":um": { N: "1" },
                ":entity": { S: "PAGE_LIKE_META" },
                ":payload": { S: "{}" },
              },
            },
          },
        ],
      }));
    } catch (error) {
      if ((error as { name?: string }).name !== "TransactionCanceledException") throw error;
    }
    const meta = await this.getItemAttrs(`PAGE#${paginaId}`, "LIKE_META");
    return Number(meta?.total?.N || 0);
  }

  public async descurtir(paginaId: string, usuarioId: string): Promise<number> {
    this.assertTabelaConfigurada();
    try {
      await this.cliente.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Delete: {
              TableName: this.tabela,
              Key: {
                pk: { S: `PAGE#${paginaId}` },
                sk: { S: `LIKE#${usuarioId}` },
              },
              ConditionExpression: "attribute_exists(pk)",
            },
          },
          {
            Update: {
              TableName: this.tabela,
              Key: {
                pk: { S: `PAGE#${paginaId}` },
                sk: { S: "LIKE_META" },
              },
              UpdateExpression: "ADD #total :menos",
              ConditionExpression: "attribute_exists(pk) AND #total > :zero",
              ExpressionAttributeNames: { "#total": "total" },
              ExpressionAttributeValues: {
                ":menos": { N: "-1" },
                ":zero": { N: "0" },
              },
            },
          },
        ],
      }));
    } catch (error) {
      if ((error as { name?: string }).name !== "TransactionCanceledException") throw error;
    }
    const meta = await this.getItemAttrs(`PAGE#${paginaId}`, "LIKE_META");
    return Math.max(0, Number(meta?.total?.N || 0));
  }

  private async getItemAttrs(pk: string, sk: string): Promise<Record<string, AttributeValue> | null> {
    this.assertTabelaConfigurada();
    const resposta = await this.cliente.send(new GetItemCommand({
      TableName: this.tabela,
      ConsistentRead: true,
      Key: {
        pk: { S: pk },
        sk: { S: sk },
      },
    }));
    return resposta.Item || null;
  }
}
