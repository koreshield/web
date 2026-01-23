FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY pyproject.toml .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "src.koreshield.proxy:app", "--host", "0.0.0.0", "--port", "8000"]

