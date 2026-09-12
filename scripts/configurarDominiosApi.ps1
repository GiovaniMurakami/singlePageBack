# Cria custom domains da API (API Gateway + Route53).
# Rode DEPOIS que o certificado ACM estiver ISSUED
# (após apontar os NS no registro.br para o Route53).
#
# Uso: powershell -File scripts/configurarDominiosApi.ps1

$ErrorActionPreference = "Stop"
$Region = "us-east-1"
$ZoneId = "Z07860201ZNKLGBC7DFRA"
$CertArn = if ($env:API_CERT_ARN) { $env:API_CERT_ARN } else { "arn:aws:acm:us-east-1:164704185653:certificate/a7c66ca0-3d20-469d-a703-02d21853e0fc" }

$status = aws acm describe-certificate --certificate-arn $CertArn --region $Region --query "Certificate.Status" --output text
if ($status -ne "ISSUED") {
  throw "Certificado ainda em $status. Aponte os NS no registro.br e espere ISSUED."
}

$dominios = @(
  @{ Nome = "api.homolog.singlepage.com.br"; RestApiId = "yvauyxdyic"; Stage = "dev" },
  @{ Nome = "api.singlepage.com.br"; RestApiId = "mao94ci2z8"; Stage = "prod" }
)

$existentes = aws apigateway get-domain-names --region $Region --query "items[].domainName" --output json | ConvertFrom-Json

foreach ($d in $dominios) {
  if ($existentes -notcontains $d.Nome) {
    $criado = aws apigateway create-domain-name `
      --domain-name $d.Nome `
      --regional-certificate-arn $CertArn `
      --endpoint-configuration "types=REGIONAL" `
      --security-policy TLS_1_2 `
      --region $Region `
      --output json | ConvertFrom-Json

    aws apigateway create-base-path-mapping `
      --domain-name $d.Nome `
      --rest-api-id $d.RestApiId `
      --stage $d.Stage `
      --region $Region | Out-Null

    $target = $criado.regionalDomainName
    $hz = $criado.regionalHostedZoneId
    Write-Host "Criado $($d.Nome) -> $target"
  } else {
    $info = aws apigateway get-domain-name --domain-name $d.Nome --region $Region --output json | ConvertFrom-Json
    $target = $info.regionalDomainName
    $hz = $info.regionalHostedZoneId
    Write-Host "Já existe $($d.Nome)"
  }

  $batch = @"
{
  "Comment": "API alias $($d.Nome)",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$($d.Nome)",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$hz",
          "DNSName": "$target",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$($d.Nome)",
        "Type": "AAAA",
        "AliasTarget": {
          "HostedZoneId": "$hz",
          "DNSName": "$target",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
"@
  $batchPath = Join-Path $env:TEMP ("r53-" + $d.Nome + ".json")
  [System.IO.File]::WriteAllText($batchPath, $batch)
  aws route53 change-resource-record-sets --hosted-zone-id $ZoneId --change-batch "file://$batchPath" | Out-Null
  Write-Host "Route53 OK: $($d.Nome)"
}

Write-Host "Pronto."
