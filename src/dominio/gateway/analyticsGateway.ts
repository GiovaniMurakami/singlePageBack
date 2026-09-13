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

export type EventoAnalytics = {
  tipo: "visita" | "clique" | "formulario";
  visitanteId?: string;
  alvo?: string;
  origem?: string;
  hora?: number;
};

export interface AnalyticsGateway {
  registrar(paginaId: string, evento: EventoAnalytics): Promise<void>;
  obter(paginaId: string, dias?: number): Promise<{ totais: TotaisAnalytics; serie: DiaAnalytics[] }>;
}
