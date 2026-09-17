#!/usr/bin/env bash
# Despliega la arquitectura completa en AWS: EC2 (API), Lambda+API Gateway
# (métricas) y S3+CloudFront (frontend).
#
# Requisitos previos: AWS CLI y AWS SAM CLI configurados con credenciales
# válidas (`aws configure`). Ver infra/README.md para el detalle de cada
# parámetro.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
STACK_PREFIX="team-board"

VPC_ID="${VPC_ID:?Define VPC_ID (ver 'aws ec2 describe-vpcs')}"
SUBNET_ID="${SUBNET_ID:?Define SUBNET_ID (subnet pública de esa VPC)}"
KEY_NAME="${KEY_NAME:?Define KEY_NAME (par de claves EC2 existente)}"
REPO_URL="${REPO_URL:?Define REPO_URL (git remote del proyecto)}"
JWT_SECRET="${JWT_SECRET:?Define JWT_SECRET}"
MONGO_URI="${MONGO_URI:-}" # si se deja vacío, se usa tras desplegar EC2

echo "== 1/3: EC2 (API de usuarios y notas) =="
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "${STACK_PREFIX}-api" \
  --template-file infra/cloudformation/ec2-api.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    VpcId="$VPC_ID" \
    SubnetId="$SUBNET_ID" \
    KeyName="$KEY_NAME" \
    RepoUrl="$REPO_URL" \
    JwtSecret="$JWT_SECRET"

EC2_IP=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name "${STACK_PREFIX}-api" \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIp'].OutputValue" --output text)

if [ -z "$MONGO_URI" ]; then
  MONGO_URI="mongodb://${EC2_IP}:27017/team-board"
fi
echo "API desplegada en http://${EC2_IP}/api"

echo "== 2/3: Lambda + API Gateway (métricas del dashboard) =="
sam build --template-file infra/sam/template.yaml
sam deploy \
  --region "$REGION" \
  --stack-name "${STACK_PREFIX}-metrics" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides MongoUri="$MONGO_URI"

METRICS_URL=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name "${STACK_PREFIX}-metrics" \
  --query "Stacks[0].Outputs[?OutputKey=='MetricsEndpoint'].OutputValue" --output text)
echo "Métricas desplegadas en ${METRICS_URL}"

echo "== 3/3: S3 + CloudFront (frontend) =="
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "${STACK_PREFIX}-frontend" \
  --template-file infra/cloudformation/frontend-static.yaml

BUCKET=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name "${STACK_PREFIX}-frontend" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
DIST_ID=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name "${STACK_PREFIX}-frontend" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
DIST_DOMAIN=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name "${STACK_PREFIX}-frontend" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)

echo "Construyendo el frontend con las URLs de la API..."
(
  cd frontend
  echo "VITE_API_BASE=http://${EC2_IP}/api" > .env.production
  echo "VITE_DASHBOARD_API_BASE=${METRICS_URL}" >> .env.production
  npm install
  npm run build
)

aws s3 sync frontend/dist "s3://${BUCKET}" --delete
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

echo ""
echo "Listo. Frontend disponible en: https://${DIST_DOMAIN}"
