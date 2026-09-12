import { v4 as uuidv4 } from "uuid";
import { Usuario } from "../../dominio/entidade/usuario";
import { RefreshTokenGateway } from "../../dominio/gateway/refreshTokenGateway";
import { ErroPersonalizado } from "../../helpers/error/ErroPersonalizado";
import { StatusErro } from "../../helpers/error/statusErro";
import { signToken } from "../../helpers/jwt";
import { serializarUsuario } from "./serializarUsuario";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export async function emitirSessao(usuario: Usuario, refreshTokenGateway: RefreshTokenGateway) {
  const token = signToken(
    {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
    },
    "30m"
  );

  if (!token) {
    throw ErroPersonalizado.criar({
      mensagem: "Erro interno do servidor.",
      status: StatusErro.erroServidor,
    });
  }

  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  await refreshTokenGateway.salvar({ token: refreshToken, usuarioId: usuario.id, expiresAt });

  return {
    token,
    refreshToken,
    usuario: serializarUsuario(usuario),
  };
}
