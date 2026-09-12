import "./carregarEnv";
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

async function main() {
  const tabela = process.env.DYNAMODB_DATA_TABLE;
  const region = process.env.DYNAMODB_DATA_REGION || process.env.AWS_REGION || "us-east-1";
  if (!tabela) {
    throw new Error("DYNAMODB_DATA_TABLE não definida no .env");
  }

  const cliente = new DynamoDBClient({ region });

  try {
    const atual = await cliente.send(new DescribeTableCommand({ TableName: tabela }));
    if (atual.Table?.TableStatus === "ACTIVE") {
      console.log(`Tabela ${tabela} já existe em ${region}.`);
      return;
    }
  } catch (erro) {
    if (!(erro instanceof ResourceNotFoundException)) throw erro;
  }

  console.log(`Criando tabela ${tabela} em ${region}…`);
  await cliente.send(new CreateTableCommand({
    TableName: tabela,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
  }));

  await waitUntilTableExists({ client: cliente, maxWaitTime: 60 }, { TableName: tabela });

  try {
    await cliente.send(new UpdateTimeToLiveCommand({
      TableName: tabela,
      TimeToLiveSpecification: { AttributeName: "expiresAt", Enabled: true },
    }));
  } catch (erro) {
    console.warn("TTL não pôde ser ligado agora:", (erro as Error).message);
  }

  console.log(`Tabela ${tabela} pronta.`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
