import { $ } from 'bun';
import { detectGpus } from '../detect_gpus';
import { installOllama } from '../install_ollama.mjs';

export async function runExposedOllama() {
    await installOllama()

    const gpus = await detectGpus()
    const hasGpu = gpus.some(x => x.isConfigured)
    if (!hasGpu) {
        console.error('No GPU detected')
    }

    // Expose ollama by setting HOST to 0.0.0.0
    console.log('\n🌐 Configuring Ollama to listen on all interfaces...')

    try {

        // Create systemd override directory
        await $`sudo mkdir -p /etc/systemd/system/ollama.service.d`

        // Create override configuration file
        const overrideContent = `[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
`

        // Write the override file
        await $`echo ${overrideContent} | sudo tee /etc/systemd/system/ollama.service.d/override.conf > /dev/null`

        console.log('✓ Created systemd override configuration')

        // Reload systemd daemon
        await $`sudo systemctl daemon-reload`
        console.log('✓ Reloaded systemd daemon')

        // Restart Ollama service
        await $`sudo systemctl restart ollama`
        console.log('✓ Restarted Ollama service')

        // Wait a moment for service to start
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verify service is running
        await $`systemctl is-active ollama`.quiet()
        console.log('✓ Ollama service is active')

        // Verify Ollama is listening on 0.0.0.0
        const envCheck = await $`systemctl show ollama -p Environment`.text()
        if (envCheck.includes('OLLAMA_HOST=0.0.0.0:11434')) {
            console.log('✓ Ollama is now exposed on 0.0.0.0:11434')
        } else {
            console.log('⚠ Warning: Could not verify OLLAMA_HOST configuration')
        }

        console.log('\n✅ Ollama is now accessible from external connections on port 11434')

    } catch (error) {
        console.error('✗ Failed to configure Ollama exposure')
        console.error('Error details:', error instanceof Error ? error.message : String(error))
        throw new Error('Failed to expose Ollama service')
    }
}
