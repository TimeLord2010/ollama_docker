import { $ } from 'bun'

export async function installNginx() {
    console.log('\n🌐 Checking Nginx installation...')

    // Check if nginx is already installed
    try {
        const version = await $`nginx -v`.text()
        console.log(`✓ Nginx is already installed: ${version.trim()}`)

        // Check if nginx service is running
        try {
            await $`systemctl is-active nginx`.quiet()
            console.log('✓ Nginx service is running')
        } catch (error) {
            console.log('⚠ Nginx service is not running, starting it...')
            try {
                await $`sudo systemctl start nginx`
                console.log('✓ Nginx service started successfully')
            } catch (startError) {
                console.log('✗ Failed to start Nginx service')
                throw new Error('Nginx service could not be started')
            }
        }

        return
    } catch (error) {
        console.log('✗ Nginx is not installed')
    }

    // Install Nginx
    console.log('\n📥 Installing Nginx...')
    try {
        // Update package index
        console.log('Updating package index...')
        await $`sudo apt-get update`

        // Install Nginx
        console.log('Installing Nginx...')
        await $`sudo apt-get install -y nginx`

        // Verify installation
        const version = await $`nginx -v`.text()
        console.log(`✓ Nginx installed successfully: ${version.trim()}`)

        // Start and enable Nginx service
        console.log('Starting Nginx service...')
        await $`sudo systemctl start nginx`
        await $`sudo systemctl enable nginx`
        console.log('✓ Nginx service started and enabled')

    } catch (installError) {
        console.log('✗ Failed to install Nginx')
        console.log('\nError details:', installError.message)
        console.log('\nPlease install Nginx manually:')
        console.log('  sudo apt-get update')
        console.log('  sudo apt-get install -y nginx')
        throw new Error('Nginx installation failed')
    }

    console.log('✓ Nginx installation complete')
}
