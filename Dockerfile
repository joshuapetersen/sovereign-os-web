# Sovereign OS Cloud Run Container Image Specification
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY . /app

# Install Python requirements
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    requests \
    numpy \
    pydantic

EXPOSE 8080

ENV PORT=8080
ENV SARAH_GATEWAY_MODE=TRUE

CMD ["uvicorn", "cloud_app:app", "--host", "0.0.0.0", "--port", "8080"]
