import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { AnalyticsGateway, DiaAnalytics, EventoAnalytics, TotaisAnalytics } from "../../../dominio/gateway/analyticsGateway";
import { BaseDynamoRepositorio } from "./baseDynamoRepositorio";

const TOTAIS_VAZIO = (): TotaisAnalytics => ({
  visitas: 0,
  cliques: 0,
  formularios: 0,
  porHora: Array.from({ length: 24 }, () => 0),
  destinos: {},
  origens: {},
  atualizadoEm: new Date().toISOString(),
});

function hojeISO(agora = new Date()) {
  return agora.toISOString().slice(0, 10);
}

function somarMapa(mapa: Record<string, number>, chave: string, limite = 24) {
  if (!chave) return mapa;
  const proximo = { ...mapa, [chave]: (mapa[chave] || 0) + 1 };
  const entradas = Object.entries(proximo).sort((a, b) => b[1] - a[1]).slice(0, limite);
  return Object.fromEntries(entradas);
}

export class AnalyticsDynamoRepositorio extends BaseDynamoRepositorio implements AnalyticsGateway {
  private constructor() {
    super();
  }

  public static criar() {
    return new AnalyticsDynamoRepositorio();
  }

  private pk(paginaId: string) {
    return `PAGE#${paginaId}`;
  }

  public async registrar(paginaId: string, evento: EventoAnalytics): Promise<void> {
    const pk = this.pk(paginaId);
    const data = hojeISO();
    const totais = (await this.getJson<TotaisAnalytics>(pk, "STATS")) || TOTAIS_VAZIO();
    const dia = (await this.getJson<DiaAnalytics>(pk, `STATS#${data}`)) || {
      data,
      visitas: 0,
      cliques: 0,
      formularios: 0,
      unicos: 0,
      vistos: [],
    };

    if (evento.tipo === "visita") {
      totais.visitas += 1;
      dia.visitas += 1;
      const vid = evento.visitanteId || "";
      if (vid && !dia.vistos.includes(vid)) {
        dia.unicos += 1;
        dia.vistos = [...dia.vistos, vid].slice(-400);
      }
    } else if (evento.tipo === "clique") {
      totais.cliques += 1;
      dia.cliques += 1;
      if (evento.alvo) totais.destinos = somarMapa(totais.destinos, evento.alvo);
    } else {
      totais.formularios += 1;
      dia.formularios += 1;
    }

    const hora = evento.hora ?? new Date().getUTCHours();
    totais.porHora[hora] = (totais.porHora[hora] || 0) + 1;
    if (evento.origem) totais.origens = somarMapa(totais.origens, evento.origem, 16);
    totais.atualizadoEm = new Date().toISOString();

    await this.transactWrite([
      { Put: { TableName: this.tabela, Item: this.itemJson(pk, "STATS", totais, { entity: "PAGE_STATS" }) } },
      { Put: { TableName: this.tabela, Item: this.itemJson(pk, `STATS#${data}`, dia, { entity: "PAGE_STATS_DAY" }) } },
    ]);
  }

  public async obter(paginaId: string, dias = 14) {
    const pk = this.pk(paginaId);
    const totais = (await this.getJson<TotaisAnalytics>(pk, "STATS")) || TOTAIS_VAZIO();
    this.assertTabelaConfigurada();
    const resposta = await this.cliente.send(new QueryCommand({
      TableName: this.tabela,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: pk },
        ":sk": { S: "STATS#" },
      },
      ConsistentRead: true,
    }));

    const serie = (resposta.Items || [])
      .map((item) => {
        if (!item.payload?.S) return null;
        return JSON.parse(item.payload.S) as DiaAnalytics;
      })
      .filter((item): item is DiaAnalytics => Boolean(item?.data))
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-dias)
      .map(({ vistos: _vistos, ...dia }) => dia);

    return { totais, serie };
  }
}
