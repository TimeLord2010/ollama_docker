#!/usr/bin/env bun
import { configureNginxAuth } from './src/configure_nginx_auth.mjs'
import { installNginx } from './src/install_nginx.mjs'
import { installOllama } from './src/install_ollama.mjs'

console.log('🚀 Setting up Ollama with Nginx reverse proxy and API key authentication\n')

try {
    // Step 1: Install Ollama CLI if not present
    await installOllama()

    // Step 2: Install Nginx if not present
    await installNginx()

    // Step 3: Configure Nginx with API key authentication
    await configureNginxAuth()

    console.log('\n✅ Setup complete!')
    console.log('\n📝 Important:')
    console.log('   - Nginx is proxying requests from port 80 to Ollama')
    console.log('   - API Key: ollama-123')
    console.log('   - For security, manually reconfigure Ollama to listen on localhost:11434')
    console.log('\n🧪 Test your setup:')
    console.log('   curl http://localhost/ollama/api/generate \\')
    console.log('     -X POST \\')
    console.log('     -H "Content-Type: application/json" \\')
    console.log('     -H "X-API-Key: ollama-123" \\')
    console.log('     -d \'{"model":"qwen3:0.6b","prompt":"Hello!"}\'')

} catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
}
