import { TokenBlacklistGateway } from "../../../dominio/gateway/tokenBlacklistGateway";
import { hashToken } from "../../../helpers/tokenHash";
import { BaseDynamoRepositorio } from "./baseDynamoRepositorio";

type TokenBlacklistItem = {
  tokenHash: string;
  expiresAt: string;
};

export class TokenBlacklistDynamoRepositorio extends BaseDynamoRepositorio implements TokenBlacklistGateway {
  private constructor() {
    super();
  }

  public static criar() {
    return new TokenBlacklistDynamoRepositorio();
  }

  public async adicionar(token: string, expiresAt: Date): Promise<void> {
    const tokenHash = hashToken(token);
    await this.transactWriteRequests([
      this.toPutRequest(
        `TOKEN_BLACKLIST#${tokenHash}`,
        "DATA",
        { tokenHash, expiresAt: expiresAt.toISOString() } satisfies TokenBlacklistItem,
        { entity: "TOKEN_BLACKLIST", expiresAt }
      ),
    ]);
  }

  public async existe(token: string): Promise<boolean> {
    const item = await this.getJson<TokenBlacklistItem>(`TOKEN_BLACKLIST#${hashToken(token)}`, "DATA");
    if (!item) return false;
    return new Date(item.expiresAt) > new Date();
  }
}
