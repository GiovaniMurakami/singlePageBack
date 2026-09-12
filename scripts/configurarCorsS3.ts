import "./carregarEnv";
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";
import { getCorsOrigins, getS3Bucket, getS3Region } from "../src/helpers/env";

async function main() {
  const bucket = getS3Bucket();
  const region = getS3Region();
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET não configurado.");
  }

  const origins = getCorsOrigins();
  if (!origins.length) {
    throw new Error("Nenhuma origem CORS configurada.");
  }

  const client = new S3Client({ region });
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "HEAD", "POST"],
            AllowedOrigins: origins,
            ExposeHeaders: ["ETag", "x-amz-request-id"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    })
  );

  console.log(`CORS do bucket ${bucket} atualizado:`);
  origins.forEach((origin) => console.log(`  - ${origin}`));
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
