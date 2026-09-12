import { CasoDeUso } from "../casoDeUso";
import { listarPlanosPublicos } from "../../helpers/planos";

export class ListarPlanos implements CasoDeUso<void, ReturnType<typeof listarPlanosPublicos>> {
  public static criar() {
    return new ListarPlanos();
  }

  public async executar() {
    return listarPlanosPublicos();
  }
}
