import { $ } from 'bun'

export async function installOllama() {
    console.log('📦 Checking Ollama installation...')

    // Check if ollama is already installed
    try {
        const version = await $`ollama --version`.text()
        console.log(`✓ Ollama is already installed: ${version.trim()}`)

        // Check if ollama service is running
        try {
            await $`systemctl is-active ollama`.quiet()
            console.log('✓ Ollama service is running')
        } catch (error) {
            console.log('⚠ Ollama service is not running, starting it...')
            try {
                await $`sudo systemctl start ollama`
                console.log('✓ Ollama service started successfully')
            } catch (startError) {
                console.log('✗ Failed to start Ollama service')
                throw new Error('Ollama service could not be started')
            }
        }

        return
    } catch (error) {
        console.log('✗ Ollama is not installed')
    }

    // Install Ollama
    console.log('\n📥 Installing Ollama...')
    try {
        // Download and run the official install script
        console.log('Downloading Ollama installer...')
        await $`curl -fsSL https://ollama.com/install.sh | sh`

        // Verify installation
        const version = await $`ollama --version`.text()
        console.log(`✓ Ollama installed successfully: ${version.trim()}`)

        // Check if service is running
        try {
            await $`systemctl is-active ollama`.quiet()
            console.log('✓ Ollama service is running')
        } catch (error) {
            console.log('Starting Ollama service...')
            await $`sudo systemctl start ollama`
            await $`sudo systemctl enable ollama`
            console.log('✓ Ollama service started and enabled')
        }

        // Pull the default model
        console.log('\n📥 Pulling default model (qwen3:0.6b)...')
        console.log('This may take a few minutes...')
        await $`ollama pull qwen3:0.6b`
        console.log('✓ Model pulled successfully')

    } catch (installError) {
        console.log('✗ Failed to install Ollama')
        console.log('\nError details:', installError.message)
        console.log('\nPlease install Ollama manually:')
        console.log('Visit: https://ollama.com/download')
        throw new Error('Ollama installation failed')
    }

    console.log('✓ Ollama installation complete')
}
