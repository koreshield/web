FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CONFIG_FILE=config/railway-config.yaml

# Create a non-root user
RUN groupadd -r koreshield && useradd -r -g koreshield koreshield

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
# Install gunicorn explicitly here as well to ensure it's available even if requirements.txt lags, 
# although we added it to pyproject.toml mostly for dev/local consistency.
# Using --no-cache-dir to keep image small.
RUN pip install --no-cache-dir -r requirements.txt gunicorn uvicorn

# Copy application code
COPY src/ ./src/
COPY pyproject.toml .
COPY config/ ./config/

# Change ownership to non-root user
RUN chown -R koreshield:koreshield /app

# Switch to non-root user
USER koreshield

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/status || exit 1

# Run the application using Gunicorn with Uvicorn workers
CMD ["gunicorn", "src.koreshield.proxy:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
