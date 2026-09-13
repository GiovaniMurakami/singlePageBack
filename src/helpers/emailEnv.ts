export function getSesFrom(): string {
  return process.env.SES_FROM?.trim() || "Single <noreply@singlepage.com.br>";
}

export function getEmailSuporte(): string {
  return process.env.EMAIL_SUPORTE?.trim() || "giovani.murakami@outlook.com";
}
