import { $ } from 'bun'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * Detects GPU type and configuration on the system
 * @returns {Promise<{type: 'nvidia'|'amd'|'none', hasDrivers: boolean, hasRocm: boolean}>}
 */
async function detectGPU() {
    const result = {
        type: 'none',
        hasDrivers: false,
        hasRocm: false
    }

    // Check for NVIDIA GPU
    try {
        await $`nvidia-smi`.quiet()
        result.type = 'nvidia'
        result.hasDrivers = true
        console.log('✓ NVIDIA GPU detected with drivers installed')
    } catch (error) {
        // nvidia-smi not found or failed
    }

    // Check for AMD GPU with ROCm
    if (result.type === 'none') {
        try {
            await $`rocm-smi`.quiet()
            result.type = 'amd'
            result.hasRocm = true
            result.hasDrivers = true
            console.log('✓ AMD GPU detected with ROCm configured')
        } catch (error) {
            // rocm-smi not found
        }
    }

    // Check for AMD GPU without ROCm (via lspci on Linux or other methods)
    if (result.type === 'none') {
        try {
            const output = await $`lspci`.text().catch(() => '')
            if (output.toLowerCase().includes('amd') && (output.toLowerCase().includes('vga') || output.toLowerCase().includes('display'))) {
                result.type = 'amd'
                result.hasDrivers = false
                console.warn('⚠ AMD GPU detected but ROCm is not configured')
                console.warn('  Install ROCm and configure Docker with the "rocm" runtime to enable GPU support')
            }
        } catch (error) {
            // lspci not available (might be Windows)
        }
    }

    // Check for NVIDIA GPU without drivers (via lspci)
    if (result.type === 'none') {
        try {
            const output = await $`lspci`.text().catch(() => '')
            if (output.toLowerCase().includes('nvidia')) {
                result.type = 'nvidia'
                result.hasDrivers = false
                console.warn('⚠ NVIDIA GPU detected but drivers/nvidia-container-toolkit not installed')
                console.warn('  Install nvidia-container-toolkit to enable GPU support')
            }
        } catch (error) {
            // lspci not available
        }
    }

    if (result.type === 'none') {
        console.warn('⚠ No GPU detected on this system')
        console.log('  Ollama will run in CPU-only mode')
    }

    return result
}

/**
 * Builds a Docker Compose file with GPU support based on system configuration
 * @returns {Promise<void>}
 */
export async function buildComposeFile() {
    console.log('Building Docker Compose file...')

    const gpu = await detectGPU()

    const services: Record<"ollama" | 'nginx', IdockerService> = {
        nginx: {
            image: 'nginx:alpine',
            container_name: 'nginx-proxy',
            restart: 'unless-stopped',
            ports: ['80:80'],
            volumes: ['./nginx.conf:/etc/nginx/nginx.conf:ro'],
            depends_on: ['ollama'],
            networks: ['ollama-network']
        },
        ollama: {
            image: 'ollama/ollama:latest',
            container_name: 'ollama',
            restart: 'unless-stopped',
            volumes: ['ollama-data:/root/.ollama'],
            expose: ['11434'],
            networks: ['ollama-network'],
            shm_size: '1g'
        }
    }
    // Base compose structure
    const compose = {
        services: services,
        networks: {
            'ollama-network': {
                driver: 'bridge'
            }
        },
        volumes: {
            'ollama-data': null
        }
    }

    // Add GPU configuration based on detection
    if (gpu.type === 'nvidia' && gpu.hasDrivers) {
        compose.services.ollama.deploy = {
            resources: {
                reservations: {
                    devices: [
                        {
                            driver: 'nvidia',
                            count: 'all',
                            capabilities: ['gpu']
                        }
                    ]
                }
            }
        }
        console.log('✓ NVIDIA GPU support enabled in Docker Compose')
    } else if (gpu.type === 'amd' && gpu.hasRocm) {
        compose.services.ollama.runtime = 'rocm'
        console.log('✓ AMD ROCm support enabled in Docker Compose')
    }

    // Convert to YAML format manually (since we're using Bun and want to avoid extra dependencies)
    const yaml = generateYAML(compose)

    // Write the compose file
    const composePath = join(process.cwd(), 'docker-compose.yml')
    await writeFile(composePath, yaml, 'utf-8')

    console.log('✓ Docker Compose file generated successfully')
}

/**
 * Converts a JavaScript object to YAML format
 * @param {object} obj - The object to convert
 * @param {number} indent - Current indentation level
 * @returns {string} YAML string
 */
function generateYAML(obj: object, indent: number = 0): string {
    const spaces = '  '.repeat(indent)
    let yaml = ''

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            yaml += `${spaces}${key}:\n`
        } else if (Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`
            for (const item of value) {
                if (typeof item === 'object' && item !== null) {
                    yaml += `${spaces}  -\n`
                    yaml += generateYAML(item, indent + 2).split('\n').map(line =>
                        line ? `  ${line}` : line
                    ).join('\n')
                } else {
                    yaml += `${spaces}  - ${formatValue(item)}\n`
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            yaml += `${spaces}${key}:\n`
            yaml += generateYAML(value, indent + 1)
        } else {
            yaml += `${spaces}${key}: ${formatValue(value)}\n`
        }
    }

    return yaml
}

/**
 * Formats a value for YAML output
 * @param {any} value - The value to format
 * @returns {string} Formatted value
 */
function formatValue(value: string) {
    if (typeof value === 'string') {
        // Quote strings that contain special characters or look like numbers
        if (value.includes(':') || value.includes('#') || /^\d+$/.test(value) || value.includes("'")) {
            return `'${value.replace(/'/g, "''")}'`
        }
        return value
    }
    return String(value)
}


interface IdockerService {
    image: string
    container_name: string
    restart?: 'unless-stopped'
    expose?: string[]
    ports?: string[]
    volumes: string[]
    depends_on?: string[]
    networks?: string[]
    shm_size?: `${number}g`
    deploy?: any
    runtime?: string
}