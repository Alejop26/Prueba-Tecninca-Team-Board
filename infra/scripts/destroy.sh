#!/usr/bin/env bash
# Retira todos los recursos AWS creados por deploy.sh.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
STACK_PREFIX="team-board"

echo "Vaciando el bucket del frontend (CloudFormation no borra buckets no vacíos)..."
BUCKET=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name "${STACK_PREFIX}-frontend" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text 2>/dev/null || true)
if [ -n "${BUCKET:-}" ] && [ "$BUCKET" != "None" ]; then
  aws s3 rm "s3://${BUCKET}" --recursive || true
fi

echo "== Retirando frontend (S3 + CloudFront) =="
aws cloudformation delete-stack --region "$REGION" --stack-name "${STACK_PREFIX}-frontend"
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name "${STACK_PREFIX}-frontend"

echo "== Retirando métricas (Lambda + API Gateway) =="
aws cloudformation delete-stack --region "$REGION" --stack-name "${STACK_PREFIX}-metrics"
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name "${STACK_PREFIX}-metrics"

echo "== Retirando API (EC2) =="
aws cloudformation delete-stack --region "$REGION" --stack-name "${STACK_PREFIX}-api"
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name "${STACK_PREFIX}-api"

echo "Todos los recursos han sido retirados."
