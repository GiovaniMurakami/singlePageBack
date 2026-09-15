import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteItemsCommand,
  type AttributeValue,
  type TransactWriteItem,
  type WriteRequest,
} from "@aws-sdk/client-dynamodb";

type DynamoItem = Record<string, AttributeValue>;
type DynamoWriteRequest = WriteRequest;

export abstract class BaseDynamoRepositorio {
  protected readonly cliente: DynamoDBClient;
  protected readonly tabela: string;

  protected constructor() {
    this.tabela = process.env.DYNAMODB_DATA_TABLE || "";
    const region = process.env.DYNAMODB_DATA_REGION || process.env.AWS_REGION || "us-east-1";
    this.cliente = new DynamoDBClient({ region });
  }

  protected assertTabelaConfigurada(): void {
    if (!this.tabela) {
      throw new Error("Variável de ambiente obrigatória não definida: DYNAMODB_DATA_TABLE");
    }
  }

  protected itemJson<T>(
    pk: string,
    sk: string,
    payload: T,
    extras: Record<string, string | number | Date | undefined> = {}
  ): DynamoItem {
    return {
      pk: { S: pk },
      sk: { S: sk },
      payload: { S: JSON.stringify(payload) },
      ...this.extrasParaItem(extras),
    };
  }

  protected toPutRequest<T>(
    pk: string,
    sk: string,
    payload: T,
    extras: Record<string, string | number | Date | undefined> = {},
    conditionExpression?: string
  ): DynamoWriteRequest {
    return {
      PutRequest: {
        Item: {
          ...this.itemJson(pk, sk, payload, extras),
          ...(conditionExpression ? {} : {}),
        },
      },
    };
  }

  protected toDeleteRequest(pk: string, sk: string): DynamoWriteRequest {
    return {
      DeleteRequest: {
        Key: {
          pk: { S: pk },
          sk: { S: sk },
        },
      },
    };
  }

  protected async transactWrite(itens: TransactWriteItem[]): Promise<void> {
    this.assertTabelaConfigurada();
    if (itens.length === 0) return;
    if (itens.length > 100) {
      throw new Error(`Transacao DynamoDB excede o limite de 100 operacoes: ${itens.length}`);
    }
    await this.cliente.send(new TransactWriteItemsCommand({ TransactItems: itens }));
  }

  protected async transactWriteRequests(requests: DynamoWriteRequest[]): Promise<void> {
    const itens: TransactWriteItem[] = requests.map((request) => {
      if (request.PutRequest?.Item) {
        return { Put: { TableName: this.tabela, Item: request.PutRequest.Item } };
      }
      if (request.DeleteRequest?.Key) {
        return { Delete: { TableName: this.tabela, Key: request.DeleteRequest.Key } };
      }
      throw new Error("WriteRequest DynamoDB sem PutRequest ou DeleteRequest");
    });
    await this.transactWrite(itens);
  }

  protected async getJson<T>(pk: string, sk: string): Promise<T | null> {
    this.assertTabelaConfigurada();
    const resposta = await this.cliente.send(new GetItemCommand({
      TableName: this.tabela,
      ConsistentRead: true,
      Key: {
        pk: { S: pk },
        sk: { S: sk },
      },
    }));
    return this.itemParaJson<T>(resposta.Item);
  }

  protected async queryJson<T>(pk: string): Promise<T[]> {
    this.assertTabelaConfigurada();
    const itens: T[] = [];
    let exclusiveStartKey: DynamoItem | undefined;

    do {
      const resposta = await this.cliente.send(new QueryCommand({
        TableName: this.tabela,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": { S: pk },
        },
        ConsistentRead: true,
        ExclusiveStartKey: exclusiveStartKey,
      }));

      itens.push(
        ...(resposta.Items ?? [])
          .map((item) => this.itemParaJson<T>(item))
          .filter((item): item is T => item !== null)
      );
      exclusiveStartKey = resposta.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return itens;
  }

  protected async delete(pk: string, sk: string): Promise<void> {
    this.assertTabelaConfigurada();
    await this.cliente.send(new DeleteItemCommand({
      TableName: this.tabela,
      Key: {
        pk: { S: pk },
        sk: { S: sk },
      },
    }));
  }

  protected async scanEntityJson<T>(entity: string): Promise<T[]> {
    this.assertTabelaConfigurada();
    const itens: T[] = [];
    let exclusiveStartKey: DynamoItem | undefined;

    do {
      const resposta = await this.cliente.send(new ScanCommand({
        TableName: this.tabela,
        FilterExpression: "entity = :entity",
        ExpressionAttributeValues: {
          ":entity": { S: entity },
        },
        ExclusiveStartKey: exclusiveStartKey,
      }));

      itens.push(
        ...(resposta.Items ?? [])
          .map((item) => this.itemParaJson<T>(item))
          .filter((item): item is T => item !== null)
      );
      exclusiveStartKey = resposta.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return itens;
  }

  private itemParaJson<T>(item?: DynamoItem): T | null {
    if (!item?.payload?.S) return null;
    return JSON.parse(item.payload.S) as T;
  }

  private extrasParaItem(extras: Record<string, string | number | Date | undefined>): DynamoItem {
    return Object.entries(extras).reduce<DynamoItem>((acc, [key, value]) => {
      if (value === undefined) return acc;
      if (value instanceof Date) {
        acc[key] = { N: String(Math.floor(value.getTime() / 1000)) };
      } else if (typeof value === "number") {
        acc[key] = { N: String(value) };
      } else {
        acc[key] = { S: value };
      }
      return acc;
    }, {});
  }
}
