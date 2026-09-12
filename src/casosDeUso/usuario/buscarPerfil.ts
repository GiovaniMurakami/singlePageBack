import { UsuarioGateway } from "../../dominio/gateway/usuarioGateway";
import { CasoDeUso } from "../casoDeUso";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { serializarUsuario } from "./serializarUsuario";

export class BuscarPerfil implements CasoDeUso<{ usuarioId: string }, ReturnType<typeof serializarUsuario>> {
  private constructor(private readonly usuarioGateway: UsuarioGateway) {}

  public static criar(usuarioGateway: UsuarioGateway) {
    return new BuscarPerfil(usuarioGateway);
  }

  public async executar(input: { usuarioId: string }) {
    const usuario = await this.usuarioGateway.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw ErroPersonalizado.criar({
        mensagem: "Usuário não encontrado.",
        status: StatusErro.erroNaoEncontrado,
      });
    }
    return serializarUsuario(usuario);
  }
}
