# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
	gcc \
	curl \
	&& rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt requirements-dev.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY config/ ./config/
COPY alembic.ini ./
COPY alembic/ ./alembic/

# Create startup script
RUN echo '#!/bin/bash\nset -e\necho "Running database migrations..."\nalembic upgrade head\necho "Starting server..."\nexec uvicorn src.koreshield.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips=\"*\"' > /app/start.sh && \
	chmod +x /app/start.sh

# Create non-root user
RUN useradd --create-home --shell /bin/bash koreshield
RUN chown -R koreshield:koreshield /app
USER koreshield

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD curl -f http://localhost:8000/health || exit 1

# Run the application with migrations
CMD ["/bin/bash", "/app/start.sh"]
