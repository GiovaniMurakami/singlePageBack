import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../helpers/jwt";
import { getBlacklistGateway } from "./autenticarJwtGateway";

/** Autentica se houver Bearer; se não houver, segue anônimo. */
export const autenticarJwtOpcional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);
  if (!payload || (payload.purpose && payload.purpose !== "access")) {
    next();
    return;
  }

  if (await getBlacklistGateway().existe(token)) {
    next();
    return;
  }

  req.usuario = { id: payload.id, email: payload.email, nome: payload.nome, role: payload.role || "user" };
  next();
};
