export type TotaisAnalytics = {
  visitas: number;
  cliques: number;
  formularios: number;
  porHora: number[];
  destinos: Record<string, number>;
  origens: Record<string, number>;
  atualizadoEm: string;
};

export type DiaAnalytics = {
  data: string;
  visitas: number;
  cliques: number;
  formularios: number;
  unicos: number;
  vistos: string[];
};

export type DiaAnalyticsPublico = Omit<DiaAnalytics, "vistos">;

export type EventoAnalytics = {
  tipo: "visita" | "clique" | "formulario";
  visitanteId?: string;
  alvo?: string;
  origem?: string;
  hora?: number;
};

export type RespostaFormulario = {
  id: string;
  recebidoEm: string;
  assunto?: string;
  campos: { rotulo: string; valor: string }[];
};

export interface AnalyticsGateway {
  registrar(paginaId: string, evento: EventoAnalytics): Promise<void>;
  guardarResposta(
    paginaId: string,
    resposta: { assunto?: string; campos: { rotulo: string; valor: string }[] }
  ): Promise<void>;
  obter(
    paginaId: string,
    dias?: number
  ): Promise<{ totais: TotaisAnalytics; serie: DiaAnalyticsPublico[]; respostas: RespostaFormulario[] }>;
}
