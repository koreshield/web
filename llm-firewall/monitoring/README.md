# KoreShield Monitoring Setup

This document provides comprehensive setup instructions for monitoring and alerting in KoreShield.

## Overview

KoreShield includes a comprehensive monitoring and alerting system with:
- Prometheus metrics collection
- Grafana dashboard visualization
- Multi-channel alerting (Email, Slack, Teams, PagerDuty, Webhooks)
- Configurable alert rules with cooldowns

## Prerequisites

- Prometheus server
- Grafana server
- KoreShield with monitoring enabled

## Configuration

### 1. KoreShield Configuration

Update your `config.yaml` with monitoring settings:

```yaml
monitoring:
  enabled: true
  metrics_port: 9090
  collect_interval: 30  # seconds

  alerts:
    enabled: true
    check_interval: 60  # seconds

    rules:
      - name: "High Error Rate"
        condition: "error_rate > 0.05"
        severity: "critical"
        cooldown: 300
        channels: ["email", "slack"]

      - name: "High Latency"
        condition: "avg_latency > 5.0"
        severity: "warning"
        cooldown: 600
        channels: ["webhook"]

    channels:
      email:
        enabled: true
        smtp_server: "smtp.gmail.com"
        smtp_port: 587
        username: "your-email@gmail.com"
        password: "your-app-password"
        from_address: "alerts@koreshield.com"
        to_addresses: ["admin@company.com"]

      slack:
        enabled: true
        webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

      teams:
        enabled: true
        webhook_url: "https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK"

      pagerduty:
        enabled: true
        api_key: "your-pagerduty-api-key"
        integration_key: "your-integration-key"

      webhook:
        enabled: true
        url: "https://your-monitoring-system.com/webhook"
        headers:
          Authorization: "Bearer your-token"
```

### 2. Prometheus Configuration

Add KoreShield as a scrape target in your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'koreshield'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s
```

### 3. Grafana Setup

1. Import the dashboard:
   - Go to Grafana → Dashboards → Import
   - Upload `monitoring/grafana/koreshield-dashboard.json`

2. Configure Prometheus as data source:
   - Go to Configuration → Data Sources → Add data source
   - Select Prometheus
   - Set URL to your Prometheus server (e.g., `http://localhost:9090`)

## Metrics Available

### Request Metrics
- `koreshield_requests_total`: Total requests by method, endpoint, status
- `koreshield_requests_duration_seconds`: Request duration histogram

### Security Metrics
- `koreshield_attacks_detected_total`: Detected attacks by type
- `koreshield_requests_blocked_total`: Blocked requests

### Provider Metrics
- `koreshield_provider_requests_total`: Requests to each provider
- `koreshield_provider_latency_seconds`: Provider response time histogram

### System Metrics
- `koreshield_active_connections`: Current active connections
- `koreshield_memory_usage_bytes`: Memory usage
- `koreshield_cpu_usage_percent`: CPU usage percentage

## Alert Rules

Alert rules use Python expressions evaluated against collected metrics:

### Available Variables
- `request_rate`: Requests per second
- `error_rate`: Error rate (0.0-1.0)
- `avg_latency`: Average response time in seconds
- `blocked_rate`: Blocked requests per second
- `active_connections`: Current connections
- `memory_mb`: Memory usage in MB
- `cpu_percent`: CPU usage percentage

### Example Rules
```yaml
rules:
  - name: "High Error Rate"
    condition: "error_rate > 0.05"
    severity: "critical"
    cooldown: 300
    channels: ["email", "pagerduty"]

  - name: "Memory Usage Warning"
    condition: "memory_mb > 500"
    severity: "warning"
    cooldown: 600
    channels: ["slack"]
```

## Testing Alerts

To test alert delivery:

1. Start KoreShield with monitoring enabled
2. Generate test traffic or modify alert conditions to trigger
3. Check logs for alert firing
4. Verify delivery in respective channels

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Prometheus**
   - Check KoreShield logs for errors
   - Verify metrics endpoint is accessible: `curl http://localhost:9090/metrics`
   - Ensure Prometheus can reach KoreShield

2. **Alerts not firing**
   - Check alert rule conditions
   - Verify monitoring configuration
   - Check KoreShield logs for evaluation errors

3. **Grafana dashboard empty**
   - Confirm Prometheus data source is configured
   - Check metric names match dashboard queries
   - Verify time range includes data

### Debug Commands

```bash
# Check metrics endpoint
curl http://localhost:9090/metrics

# Test Prometheus scrape
curl http://localhost:9090/api/v1/query?query=koreshield_requests_total

# Check KoreShield logs
tail -f /path/to/koreshield/logs
```

## Security Considerations

- Protect metrics endpoint with authentication if exposed externally
- Use HTTPS for webhook URLs
- Store API keys and credentials securely
- Monitor alert channels for potential abuse

## Performance Impact

- Metrics collection adds minimal overhead (<1% CPU)
- Alert evaluation runs asynchronously
- Memory usage scales with number of active metrics
- Network impact depends on alert frequency and channels