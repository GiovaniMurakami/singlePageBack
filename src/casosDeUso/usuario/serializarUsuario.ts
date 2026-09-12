import { Usuario } from "../../dominio/entidade/usuario";
import { obterPlano } from "../../helpers/planos";

export function serializarUsuario(usuario: Usuario) {
  const planoEfetivo = usuario.planoEfetivo();
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    plano: planoEfetivo,
    statusAssinatura: usuario.statusAssinatura,
    limites: obterPlano(planoEfetivo),
    criadoEm: usuario.criadoEm,
  };
}
