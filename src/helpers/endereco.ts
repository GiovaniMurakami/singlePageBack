export const HOST_APEX = "singlepage.com.br";

const ENDERECOS_RESERVADOS = new Set([
  "www",
  "app",
  "api",
  "mail",
  "ftp",
  "cdn",
  "static",
  "assets",
  "admin",
  "criar",
  "entrar",
  "cadastrar",
  "precos",
  "comunidade",
  "conta",
  "termos",
  "privacidade",
  "lgpd",
  "cookies",
  "legal",
  "p",
  "verificar-email",
  "esqueci-senha",
  "redefinir-senha",
  "homolog",
  "staging",
  "beta",
  "status",
  "docs",
  "blog",
  "help",
  "suporte",
  "dashboard",
  "editor",
  "preview",
  "smtp",
  "imap",
  "ns",
  "origin",
]);

export function limparEndereco(endereco: string): string {
  return String(endereco || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

export function enderecoReservado(endereco: string): boolean {
  return ENDERECOS_RESERVADOS.has(limparEndereco(endereco));
}

export function usaSubdominioNoHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.includes("amplifyapp.com")) return false;
  if (host === `homolog.${HOST_APEX}` || host.endsWith(`.homolog.${HOST_APEX}`)) return false;
  return host === HOST_APEX || host === `www.${HOST_APEX}` || host.endsWith(`.${HOST_APEX}`);
}

export function urlPublicaNoFrontend(frontendUrl: string, slug: string): string {
  const limpo = limparEndereco(slug);
  try {
    const url = new URL(frontendUrl);
    if (!usaSubdominioNoHost(url.hostname)) {
      return `${frontendUrl.replace(/\/+$/, "")}/${limpo}`;
    }
    const apex = url.hostname.replace(/^www\./, "");
    return `${url.protocol}//${limpo}.${apex}`;
  } catch {
    return `${frontendUrl.replace(/\/+$/, "")}/${limpo}`;
  }
}

export function ehOriginSubdominioSingle(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (host === HOST_APEX || host === `www.${HOST_APEX}`) return true;
    if (!host.endsWith(`.${HOST_APEX}`)) return false;
    const sub = host.slice(0, -(`.${HOST_APEX}`).length);
    const partes = sub.split(".");
    if (partes.length === 1 && partes[0]) return true;
    if (partes.length === 2 && partes[1] === "homolog" && partes[0]) return true;
    return false;
  } catch {
    return false;
  }
}
