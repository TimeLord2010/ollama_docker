import { $ } from 'bun'

export async function installDocker() {
    console.log('Checking Docker installation...')

    // Check if docker is already installed
    try {
        const dockerVersion = await $`docker --version`.text()
        console.log(`✓ Docker is already installed: ${dockerVersion.trim()}`)

        // Check if docker daemon is running
        try {
            await $`docker ps`.quiet()
            console.log('✓ Docker daemon is running')
        } catch (error) {
            console.log('⚠ Docker is installed but daemon is not running')
            console.log('Attempting to start Docker service...')
            try {
                await $`sudo systemctl start docker`
                await $`docker ps`.quiet()
                console.log('✓ Docker daemon started successfully')
            } catch (startError) {
                console.log('✗ Failed to start Docker daemon')
                throw new Error('Docker daemon could not be started. Please check Docker installation.')
            }
        }
    } catch (error) {
        console.log('✗ Docker is not installed')
        console.log('\nInstalling Docker Engine for Ubuntu...')

        try {
            // Update package index
            console.log('Updating package index...')
            await $`sudo apt-get update`

            // Install prerequisites
            console.log('Installing prerequisites...')
            await $`sudo apt-get install -y ca-certificates curl gnupg lsb-release`

            // Add Docker's official GPG key
            console.log('Adding Docker GPG key...')
            await $`sudo install -m 0755 -d /etc/apt/keyrings`
            await $`curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg`
            await $`sudo chmod a+r /etc/apt/keyrings/docker.gpg`

            // Set up the repository
            console.log('Setting up Docker repository...')
            const repoSetup = `echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`
            await $`sh -c ${repoSetup}`

            // Update package index again
            console.log('Updating package index with Docker repository...')
            await $`sudo apt-get update`

            // Install Docker Engine
            console.log('Installing Docker Engine...')
            await $`sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`

            // Start and enable Docker service
            console.log('Starting Docker service...')
            await $`sudo systemctl start docker`
            await $`sudo systemctl enable docker`

            console.log('✓ Docker Engine installed successfully')

            // Add current user to docker group (optional, requires re-login)
            console.log('\nAdding current user to docker group...')
            try {
                const username = await $`whoami`.text()
                await $`sudo usermod -aG docker ${username.trim()}`
                console.log('✓ User added to docker group')
                console.log('⚠ Note: You may need to log out and back in for group changes to take effect')
                console.log('   Or run: newgrp docker')
            } catch (groupError) {
                console.log('⚠ Could not add user to docker group (non-critical)')
            }

        } catch (installError) {
            console.log('✗ Failed to install Docker Engine')
            console.log('\nError details:', installError.message)
            console.log('\nPlease install Docker manually:')
            console.log('Visit: https://docs.docker.com/engine/install/ubuntu/')
            throw new Error('Docker installation failed')
        }
    }

    // Check if docker compose is available
    console.log('\nChecking Docker Compose...')
    try {
        const composeVersion = await $`docker compose version`.text()
        console.log(`✓ Docker Compose is available: ${composeVersion.trim()}`)
    } catch (error) {
        console.log('✗ Docker Compose is not available')
        console.log('Installing Docker Compose plugin...')
        try {
            await $`sudo apt-get install -y docker-compose-plugin`
            const composeVersion = await $`docker compose version`.text()
            console.log(`✓ Docker Compose installed: ${composeVersion.trim()}`)
        } catch (composeError) {
            console.log('✗ Failed to install Docker Compose')
            throw new Error('Docker Compose installation failed')
        }
    }

    // Final verification
    console.log('\nVerifying Docker installation...')
    try {
        await $`docker ps`.quiet()
        console.log('✓ Docker is working correctly')
        console.log('✓ All checks passed - Docker is ready to use')
    } catch (error) {
        console.log('✗ Docker verification failed')
        console.log('Trying with sudo...')
        try {
            await $`sudo docker ps`.quiet()
            console.log('✓ Docker works with sudo')
            console.log('⚠ You may need to run: newgrp docker')
            console.log('   Or log out and back in to use Docker without sudo')
        } catch (sudoError) {
            throw new Error('Docker is installed but not working correctly')
        }
    }
}
