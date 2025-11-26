# Native Ollama Setup with Nginx Reverse Proxy

This setup installs Ollama CLI directly on your EC2 instance (no Docker) and configures Nginx as a reverse proxy with API key authentication.

## Why This Approach?

- Docker doesn't integrate well with GPUs on some systems
- Ollama CLI works directly with attached GPUs
- Nginx provides API key authentication for security
- Simple, lightweight setup

## Quick Start

### 1. Run the setup script on your EC2 instance:

```bash
bun run native_ollama/start.mjs
```

This script will:

- Install Ollama CLI (if not already installed)
- Install Nginx (if not already installed)
- Configure Nginx with API key authentication
- Pull the default model (qwen3:0.6b)

### 2. (Optional) Secure Ollama

For additional security, manually reconfigure Ollama to listen only on localhost:

```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
echo '[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"' | sudo tee /etc/systemd/system/ollama.service.d/environment.conf
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

## Usage

### Making Requests

All requests must include the API key in the `X-API-Key` header:

```bash
curl http://YOUR_EC2_IP/ollama/api/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ollama-123" \
  -d '{"model":"qwen3:0.6b","prompt":"Hello!"}'
```

### API Key

- **Fixed API Key:** `ollama-123`
- Configured in: `native_ollama/src/configure_nginx_auth.mjs`

### Endpoints

- **Ollama API:** `http://YOUR_EC2_IP/ollama/*`
- **Health Check:** `http://YOUR_EC2_IP/health` (no auth required)

## Architecture

```
Client Request (with X-API-Key header)
    ↓
Nginx (Port 80) - API Key Validation
    ↓
Ollama (Port 11434) - Local or 127.0.0.1
    ↓
Response
```

## Files

- `start.mjs` - Main setup script
- `src/install_ollama.mjs` - Installs Ollama CLI
- `src/install_nginx.mjs` - Installs Nginx
- `src/configure_nginx_auth.mjs` - Configures Nginx with API key auth
- `nginx.conf` - Generated Nginx configuration

## Troubleshooting

### Check Ollama Status

```bash
systemctl status ollama
```

### Check Nginx Status

```bash
systemctl status nginx
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Test Ollama Directly (on EC2)

```bash
curl http://localhost:11434/api/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3:0.6b","prompt":"Hello!"}'
```

### Reload Nginx Configuration

```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

## Security Notes

- The API key (`ollama-123`) is hardcoded for simplicity
- For production use, consider:
  - Using a stronger, randomly generated API key
  - Setting up HTTPS/SSL with Let's Encrypt
  - Configuring Ollama to listen only on localhost
  - Using a firewall to restrict access to specific IPs
  - Rate limiting in Nginx

## Requirements

- Ubuntu-based EC2 instance
- Bun runtime
- sudo privileges
