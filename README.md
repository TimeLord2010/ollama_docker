# ollama

A Docker-based setup for running Ollama with automatic GPU detection and configuration.

## Features

- Automatic GPU detection (NVIDIA and AMD)
- Dynamic Docker Compose file generation based on available hardware
- NGINX reverse proxy for Ollama API
- Persistent storage for models and chat history

## Quick Start

### Installation

1. Install dependencies:

```bash
bun install
```

2. Run the setup:

```bash
bun run start.mjs
```

The script will:

- Install Docker if not present
- Detect your GPU and generate an appropriate Docker Compose file
- Start the Ollama service
- Pull the default model

## GPU Support

The setup automatically detects and configures GPU support:

### NVIDIA GPU

**Requirements:**

- NVIDIA GPU with CUDA support
- NVIDIA drivers installed
- nvidia-container-toolkit

**Installation (Ubuntu/Debian):**

```bash
# Install NVIDIA drivers (if not already installed)
sudo apt update
sudo apt install nvidia-driver-535  # or latest version

# Install nvidia-container-toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify installation
nvidia-smi
```

### AMD GPU (ROCm)

**Requirements:**

- AMD GPU with ROCm support
- ROCm drivers and runtime installed
- Docker configured with ROCm runtime

**Installation (Ubuntu/Debian):**

1. **Install ROCm:**

```bash
# Download and install amdgpu-install
wget https://repo.radeon.com/amdgpu-install/latest/ubuntu/jammy/amdgpu-install_6.0.60000-1_all.deb
sudo apt install ./amdgpu-install_6.0.60000-1_all.deb

# Install ROCm
sudo amdgpu-install --usecase=rocm

# Add user to required groups
sudo usermod -a -G render,video $USER

# Reboot system
sudo reboot
```

2. **Verify ROCm installation:**

```bash
rocm-smi
```

3. **Configure Docker for ROCm:**

Edit `/etc/docker/daemon.json`:

```bash
sudo nano /etc/docker/daemon.json
```

Add the ROCm runtime configuration:

```json
{
  "runtimes": {
    "rocm": {
      "path": "/usr/bin/rocm-runtime",
      "runtimeArgs": []
    }
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

**Important Notes:**

- Check GPU compatibility at: https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html
- ROCm is primarily supported on Linux
- For Windows, use WSL2 with ROCm installed in the Linux distribution

### CPU-Only Mode

If no GPU is detected or drivers are not installed, Ollama will run in CPU-only mode. This works but will be significantly slower for model inference.

## Configuration

The script generates a `docker-compose.yml` file automatically based on your system's GPU configuration. The generated file includes:

- **NVIDIA GPUs**: Adds `deploy.resources.reservations.devices` configuration
- **AMD GPUs with ROCm**: Adds `runtime: rocm` configuration
- **No GPU/CPU-only**: Standard configuration without GPU acceleration

## Accessing Ollama

Once running, Ollama is accessible at:

- Through NGINX proxy: `http://localhost:80/ollama`

## Troubleshooting

### GPU Not Detected

Run the detection manually:

```bash
# For NVIDIA
nvidia-smi

# For AMD
rocm-smi
```

### Docker Permission Issues

Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### ROCm Runtime Not Found

Ensure Docker daemon configuration includes the ROCm runtime and Docker has been restarted.

## Project Structure

```
.
├── src/
│   ├── build_compose_file.mjs  # GPU detection and compose file generation
│   ├── install_docker.mjs      # Docker installation helper
│   └── pull_model.mjs          # Model pulling utility
├── docker-compose.yml          # Generated dynamically (do not edit manually)
├── nginx.conf                  # NGINX configuration
└── start.mjs                   # Main entry point
```

## License

This project is open source and available under the MIT License.
