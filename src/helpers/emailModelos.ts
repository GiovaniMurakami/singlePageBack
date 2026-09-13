import { getFrontendUrl } from "./env";

function envelope(titulo: string, corpoHtml: string) {
  return `<!doctype html><html><body style="font-family:IBM Plex Sans,Helvetica,sans-serif;background:#f5f5f7;padding:24px;color:#1d1d1f">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:24px;padding:28px">
    <p style="letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:#86868b;margin:0 0 12px">Single</p>
    <h1 style="font-size:28px;margin:0 0 16px">${titulo}</h1>
    ${corpoHtml}
  </div>
</body></html>`;
}

export function emailVerificacao(nome: string, token: string) {
  const url = `${getFrontendUrl()}/verificar-email?token=${encodeURIComponent(token)}`;
  return {
    assunto: "Confirme seu e-mail no Single",
    texto: `Oi, ${nome}. Confirme seu e-mail neste link: ${url}`,
    html: envelope("Confirme seu e-mail", `<p>Oi, ${nome}.</p><p>Clique para confirmar que este e-mail é seu.</p><p><a href="${url}">Confirmar e-mail</a></p>`),
  };
}

export function emailRedefinirSenha(nome: string, token: string) {
  const url = `${getFrontendUrl()}/redefinir-senha?token=${encodeURIComponent(token)}`;
  return {
    assunto: "Redefinir senha no Single",
    texto: `Oi, ${nome}. Redefina sua senha neste link: ${url}`,
    html: envelope("Redefinir senha", `<p>Oi, ${nome}.</p><p>Se você pediu para trocar a senha, use o link abaixo. Ele expira em 1 hora.</p><p><a href="${url}">Escolher nova senha</a></p>`),
  };
}

export function emailSenhaAlterada(nome: string) {
  return {
    assunto: "Sua senha no Single foi alterada",
    texto: `Oi, ${nome}. A senha da sua conta Single foi alterada. Se não foi você, responda este e-mail.`,
    html: envelope("Senha alterada", `<p>Oi, ${nome}.</p><p>A senha da sua conta Single foi alterada. Se não foi você, responda este e-mail.</p>`),
  };
}

export function emailPlanoAlterado(nome: string, plano: string, status: string) {
  return {
    assunto: `Seu plano Single agora é ${plano}`,
    texto: `Oi, ${nome}. Seu plano no Single passou para ${plano} (status: ${status}).`,
    html: envelope("Plano atualizado", `<p>Oi, ${nome}.</p><p>Seu plano no Single agora é <strong>${plano}</strong> (${status}).</p>`),
  };
}

export function emailPaginaPublicada(nome: string, titulo: string, url: string) {
  return {
    assunto: `Sua página “${titulo}” está no ar`,
    texto: `Oi, ${nome}. A página “${titulo}” foi publicada: ${url}`,
    html: envelope("Página no ar", `<p>Oi, ${nome}.</p><p>A página <strong>${titulo}</strong> está publicada.</p><p><a href="${url}">${url}</a></p>`),
  };
}

export function emailPedidoAjuda(input: {
  nome: string;
  email: string;
  assunto: string;
  pagina?: string;
  esperado?: string;
  aconteceu?: string;
  mensagem?: string;
  navegador?: string;
}) {
  const linhas = [
    `Nome: ${input.nome}`,
    `E-mail para resposta: ${input.email}`,
    `Assunto: ${input.assunto}`,
    `Página / slug: ${input.pagina || "—"}`,
    `O que esperava: ${input.esperado || "—"}`,
    `O que aconteceu: ${input.aconteceu || "—"}`,
    `Navegador: ${input.navegador || "—"}`,
    "",
    input.mensagem || "",
  ];
  return {
    assunto: `Ajuda Single — ${input.assunto}`,
    texto: linhas.join("\n"),
  };
}

export function emailFormulario(tituloPagina: string, slug: string, assunto: string, linhas: string[]) {
  const titulo = assunto || `Nova resposta em “${tituloPagina}”`;
  return {
    assunto: titulo,
    texto: [`Página: ${tituloPagina} (${slug})`, "", ...linhas].join("\n"),
    html: envelope(titulo, `<p>Página: <strong>${tituloPagina}</strong> (${slug})</p><pre style="white-space:pre-wrap;font-family:inherit">${linhas.join("\n")}</pre>`),
  };
}
