import { ehOriginSubdominioSingle, urlPublicaNoFrontend } from "./endereco";

const FRONTEND_LOCAL_URL = "http://localhost:5173";

function parseOrigins(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

export function isExecucaoLocal(): boolean {
  const valor = process.env.IS_LOCAL?.trim().toLowerCase();
  return valor === "true" || valor === "1";
}

export function getFrontendUrl(): string {
  const configured = process.env.FRONTEND_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return FRONTEND_LOCAL_URL;
}

export function getCorsOrigins(): string[] {
  const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN);
  const frontend = process.env.FRONTEND_URL?.trim();
  const origins = [
    ...configuredOrigins,
    ...(frontend ? [frontend] : []),
    FRONTEND_LOCAL_URL,
    "https://localhost:5173",
  ];
  return [...new Set(origins.map(normalizeOrigin).filter(Boolean))];
}

export function origemCorsPermitida(origin?: string): boolean {
  if (!origin) return true;
  const normalizada = normalizeOrigin(origin);
  if (getCorsOrigins().includes(normalizada)) return true;
  return ehOriginSubdominioSingle(normalizada);
}

export function urlPublicaPagina(slug: string): string {
  return urlPublicaNoFrontend(getFrontendUrl(), slug);
}

export function getS3Bucket(): string {
  return process.env.AWS_S3_BUCKET || "";
}

export function getS3Region(): string {
  return process.env.AWS_S3_REGION || "us-east-1";
}

export function getS3BaseUrl(): string {
  const bucket = getS3Bucket();
  const region = getS3Region();
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY || "";
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export function getStripePriceId(plano: "pro" | "ultra"): string {
  if (plano === "pro") return process.env.STRIPE_PRICE_PRO || "";
  return process.env.STRIPE_PRICE_ULTRA || "";
}
