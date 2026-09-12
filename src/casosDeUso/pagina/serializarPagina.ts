import { Pagina } from "../../dominio/entidade/pagina";

export function serializarPagina(pagina: Pagina) {
  return {
    id: pagina.id,
    usuarioId: pagina.usuarioId,
    titulo: pagina.titulo,
    slug: pagina.slug,
    publicada: pagina.publicada,
    tema: pagina.tema,
    blocos: pagina.blocos,
    publicadoEm: pagina.publicadoEm,
    criadoEm: pagina.criadoEm,
    atualizadoEm: pagina.atualizadoEm,
  };
}

export function serializarPaginaResumo(pagina: Pagina) {
  return {
    id: pagina.id,
    titulo: pagina.titulo,
    slug: pagina.slug,
    publicada: pagina.publicada,
    atualizadoEm: pagina.atualizadoEm,
  };
}
