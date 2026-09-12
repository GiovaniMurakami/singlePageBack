import { Usuario } from "../entidade/usuario";

export class EmailUsuarioJaExisteErro extends Error {
  public constructor() {
    super("Email de usuario ja cadastrado");
    this.name = "EmailUsuarioJaExisteErro";
  }
}

export interface UsuarioGateway {
  salvar(usuario: Usuario): Promise<void>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorStripeCustomerId(customerId: string): Promise<Usuario | null>;
  atualizar(usuario: Usuario): Promise<void>;
}
