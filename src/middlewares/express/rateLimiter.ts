import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const JANELA_MS = 15 * 60 * 1000;
const MSG_TENTATIVAS = { mensagem: "Muitas tentativas. Tente novamente em 15 minutos." };
const MSG_REQUISICOES = { mensagem: "Muitas requisições. Tente novamente em 15 minutos." };

function emTeste() {
  return process.env.NODE_ENV === "test";
}

function chaveIp(req: Request) {
  return ipKeyGenerator(req.ip || "127.0.0.1");
}

function chaveUsuario(req: Request) {
  return req.usuario?.id ? `user:${req.usuario.id}` : chaveIp(req);
}

function pularWebhookOuTeste(req: Request) {
  return emTeste() || req.path === "/assinatura/webhook";
}

const base = {
  windowMs: JANELA_MS,
  standardHeaders: true as const,
  legacyHeaders: false,
  skip: emTeste,
  validate: { ipv6Subnet: false },
};

export const apiRateLimiter = rateLimit({
  ...base,
  max: 400,
  skip: pularWebhookOuTeste,
  keyGenerator: chaveIp,
  message: MSG_REQUISICOES,
});

export const healthRateLimiter = rateLimit({
  ...base,
  max: 60,
  keyGenerator: chaveIp,
  message: MSG_REQUISICOES,
});

export const authRateLimiter = rateLimit({
  ...base,
  max: 10,
  keyGenerator: chaveIp,
  message: MSG_TENTATIVAS,
});

export const refreshTokenRateLimiter = rateLimit({
  ...base,
  max: 30,
  keyGenerator: chaveIp,
  message: MSG_TENTATIVAS,
});

export const leituraAutenticadaRateLimiter = rateLimit({
  ...base,
  max: 180,
  keyGenerator: chaveUsuario,
  message: MSG_REQUISICOES,
});

export const mutationRateLimiter = rateLimit({
  ...base,
  max: 80,
  keyGenerator: chaveUsuario,
  message: MSG_REQUISICOES,
});

export const publicReadRateLimiter = rateLimit({
  ...base,
  max: 200,
  keyGenerator: chaveIp,
  message: MSG_REQUISICOES,
});

export const uploadImagemRateLimiter = rateLimit({
  ...base,
  max: 20,
  keyGenerator: chaveUsuario,
  message: MSG_REQUISICOES,
});

export const checkoutRateLimiter = rateLimit({
  ...base,
  max: 8,
  keyGenerator: chaveUsuario,
  message: MSG_REQUISICOES,
});
