import { v4 as uuidv4 } from "uuid";
import { CodigoPlano, planoAtivoDeAssinatura } from "../../helpers/planos";

export type RoleUsuario = "user" | "admin";
export type StatusAssinatura = "nenhuma" | "trial" | "ativa" | "atrasada" | "cancelada";

export interface UsuarioProps {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role?: RoleUsuario;
  plano?: CodigoPlano;
  statusAssinatura?: StatusAssinatura;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  emailVerificado?: boolean;
  aceiteTermosEm?: Date | null;
  versaoTermos?: string | null;
  criadoEm?: Date;
}

export class Usuario {
  public id: string;
  public nome: string;
  public email: string;
  public senha: string;
  public role: RoleUsuario;
  public plano: CodigoPlano;
  public statusAssinatura: StatusAssinatura;
  public stripeCustomerId: string | null;
  public stripeSubscriptionId: string | null;
  public emailVerificado: boolean;
  public aceiteTermosEm: Date | null;
  public versaoTermos: string | null;
  public criadoEm: Date;

  constructor({
    id,
    nome,
    email,
    senha,
    role,
    plano,
    statusAssinatura,
    stripeCustomerId,
    stripeSubscriptionId,
    emailVerificado,
    aceiteTermosEm,
    versaoTermos,
    criadoEm,
  }: UsuarioProps) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.role = role || "user";
    this.plano = plano || "free";
    this.statusAssinatura = statusAssinatura || "nenhuma";
    this.stripeCustomerId = stripeCustomerId ?? null;
    this.stripeSubscriptionId = stripeSubscriptionId ?? null;
    this.emailVerificado = emailVerificado ?? true;
    this.aceiteTermosEm = aceiteTermosEm ?? null;
    this.versaoTermos = versaoTermos ?? null;
    this.criadoEm = criadoEm || new Date();
  }

  public static criar({
    nome,
    email,
    senha,
    aceiteTermosEm,
    versaoTermos,
  }: Pick<UsuarioProps, "nome" | "email" | "senha"> & Pick<UsuarioProps, "aceiteTermosEm" | "versaoTermos">) {
    return new Usuario({
      id: uuidv4(),
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      role: "user",
      plano: "free",
      statusAssinatura: "nenhuma",
      emailVerificado: false,
      aceiteTermosEm: aceiteTermosEm ?? null,
      versaoTermos: versaoTermos ?? null,
      criadoEm: new Date(),
    });
  }

  public planoEfetivo(): CodigoPlano {
    return planoAtivoDeAssinatura(this.plano, this.statusAssinatura);
  }
}
