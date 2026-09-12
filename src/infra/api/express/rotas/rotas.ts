import { NextFunction, Request, Response, RequestHandler } from "express";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export const HttpMethod = {
  GET: "get" as HttpMethod,
  POST: "post" as HttpMethod,
  PUT: "put" as HttpMethod,
  PATCH: "patch" as HttpMethod,
  DELETE: "delete" as HttpMethod,
} as const;

export interface Rotas {
  getHandler(): (
    request: Request,
    response: Response,
    next: NextFunction
  ) => Promise<void>;
  getCaminho(): string;
  getMetodo(): HttpMethod;
  getMiddlewares?(): RequestHandler[];
}

export function handlerErro(
  fn: (req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
}
