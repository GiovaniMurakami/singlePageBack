/* eslint-disable @typescript-eslint/no-explicit-any */
import serverless from "serverless-http";
import { app } from "./app";
import { preloadJwtKeys } from "./helpers/jwt";
import { logger } from "./helpers/logger";

const aplicacao = app();
const serverlessApp = serverless(aplicacao);
const runtimeReady = preloadJwtKeys();

export const handler = async (event: any, context: any) => {
  try {
    await runtimeReady;
  } catch (error) {
    logger.error({ err: error }, "falha ao inicializar runtime da lambda");
    throw error;
  }

  try {
    return await serverlessApp(event, context);
  } catch (error) {
    logger.error({ err: error, path: event?.path, method: event?.httpMethod }, "falha ao processar requisicao lambda");
    throw error;
  }
};
