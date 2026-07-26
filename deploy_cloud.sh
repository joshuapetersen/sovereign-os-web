#!/usr/bin/env bash
# Sovereign OS 1-Click Cloud Run Deployment Script
set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "sovereign-os-cloud")
SERVICE_NAME="sovereign-os-cloud-mind"
REGION="us-central1"

echo "========================================================================="
echo "          SOVEREIGN OS CLOUD DEPLOYMENT INITIATED"
echo "          Target Service: $SERVICE_NAME"
echo "          Region: $REGION"
echo "========================================================================="

echo "[1/3] Building container image with Cloud Build..."
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" .

echo "[2/3] Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8080

echo "========================================================================="
echo "  SOVEREIGN OS WEB APP LIVE ON CLOUD RUN!"
echo "========================================================================="
