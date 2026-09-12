import type { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { Usuario } from "../../../dominio/entidade/usuario";
import { EmailUsuarioJaExisteErro, UsuarioGateway } from "../../../dominio/gateway/usuarioGateway";
import { CodigoPlano } from "../../../helpers/planos";
import { StatusAssinatura } from "../../../dominio/entidade/usuario";
import { BaseDynamoRepositorio } from "./baseDynamoRepositorio";

type UsuarioItem = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: "user" | "admin";
  plano: CodigoPlano;
  statusAssinatura: StatusAssinatura;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  criadoEm: string;
};

export class UsuarioDynamoRepositorio extends BaseDynamoRepositorio implements UsuarioGateway {
  private constructor() {
    super();
  }

  public static criar() {
    return new UsuarioDynamoRepositorio();
  }

  private normalizarEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private usuarioParaItem(usuario: Usuario): UsuarioItem {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      role: usuario.role,
      plano: usuario.plano,
      statusAssinatura: usuario.statusAssinatura,
      stripeCustomerId: usuario.stripeCustomerId,
      stripeSubscriptionId: usuario.stripeSubscriptionId,
      criadoEm: usuario.criadoEm.toISOString(),
    };
  }

  private itemParaUsuario(item: UsuarioItem): Usuario {
    return new Usuario({
      ...item,
      criadoEm: new Date(item.criadoEm),
    });
  }

  public async salvar(usuario: Usuario): Promise<void> {
    const item = this.usuarioParaItem(usuario);
    try {
      await this.transactWrite([
        { Put: { TableName: this.tabela, Item: this.itemJson(`USER#${usuario.id}`, "DATA", item, { entity: "USER" }) } },
        {
          Put: {
            TableName: this.tabela,
            Item: this.itemJson(
              `USER_EMAIL#${this.normalizarEmail(usuario.email)}`,
              "DATA",
              { id: usuario.id, email: usuario.email },
              { entity: "USER_EMAIL_INDEX" }
            ),
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
      ]);
    } catch (error) {
      if ((error as { name?: string }).name === "TransactionCanceledException") {
        throw new EmailUsuarioJaExisteErro();
      }
      throw error;
    }
  }

  public async buscarPorEmail(email: string): Promise<Usuario | null> {
    const indice = await this.getJson<{ id: string }>(`USER_EMAIL#${this.normalizarEmail(email)}`, "DATA");
    if (!indice) return null;
    return this.buscarPorId(indice.id);
  }

  public async buscarPorId(id: string): Promise<Usuario | null> {
    const item = await this.getJson<UsuarioItem>(`USER#${id}`, "DATA");
    return item ? this.itemParaUsuario(item) : null;
  }

  public async buscarPorStripeCustomerId(customerId: string): Promise<Usuario | null> {
    const indice = await this.getJson<{ id: string }>(`STRIPE_CUSTOMER#${customerId}`, "DATA");
    if (!indice) return null;
    return this.buscarPorId(indice.id);
  }

  public async atualizar(usuario: Usuario): Promise<void> {
    const atual = await this.buscarPorId(usuario.id);
    const item = this.usuarioParaItem(usuario);
    const ops: TransactWriteItem[] = [
      { Put: { TableName: this.tabela, Item: this.itemJson(`USER#${usuario.id}`, "DATA", item, { entity: "USER" }) } },
    ];

    if (atual && this.normalizarEmail(atual.email) !== this.normalizarEmail(usuario.email)) {
      ops.push({
        Put: {
          TableName: this.tabela,
          Item: this.itemJson(
            `USER_EMAIL#${this.normalizarEmail(usuario.email)}`,
            "DATA",
            { id: usuario.id, email: usuario.email },
            { entity: "USER_EMAIL_INDEX" }
          ),
        },
      });
    }

    if (usuario.stripeCustomerId) {
      ops.push({
        Put: {
          TableName: this.tabela,
          Item: this.itemJson(
            `STRIPE_CUSTOMER#${usuario.stripeCustomerId}`,
            "DATA",
            { id: usuario.id },
            { entity: "STRIPE_CUSTOMER_INDEX" }
          ),
        },
      });
    }

    await this.transactWrite(ops);
  }
}
