import { $ } from 'bun';
import { detectGpus } from '../detect_gpus';

/**
 * GPU Detection Script for Ubuntu
 *
 * This script detects whether an AMD or NVIDIA GPU is present on the system.
 * It assumes it is running on an Ubuntu machine.
 */
async function diagnoseGPU() {
    const gpus = await detectGpus()
    for (const { name, type, isConfigured } of gpus) {
        console.log(`✓ GPU detected: ${name} (${type}) ${isConfigured ? '' : '[UNCONFIGURED]'}`);

        if (!isConfigured) {
            if (type == 'amd') {
                console.log('\n⚠️  AMD GPU is not fully configured. Installing amdgpu driver and ROCm...\n');

                try {
                    // Download amdgpu installer
                    console.log('Downloading amdgpu installer...');
                    await $`wget https://repo.radeon.com/amdgpu-install/latest/ubuntu/jammy/amdgpu-install_6.2.60200-1_all.deb -O /tmp/amdgpu-install.deb`;

                    // Install the package
                    console.log('Installing amdgpu package...');
                    await $`sudo apt install -y /tmp/amdgpu-install.deb`;

                    // Run amdgpu-install with ROCm support
                    console.log('Installing amdgpu driver and ROCm...');
                    await $`sudo amdgpu-install --usecase=graphics,rocm -y`;

                    console.log('\n✓ Installation completed successfully!');
                    console.log('⚠️  Please reboot your system for changes to take effect.');
                    console.log('   After reboot, run this script again to verify the installation.\n');
                } catch (error) {
                    console.error('\n✗ Installation failed:', error);
                    console.log('\nManual installation steps:');
                    console.log('1. wget https://repo.radeon.com/amdgpu-install/latest/ubuntu/jammy/amdgpu-install_*_all.deb');
                    console.log('2. sudo apt install ./amdgpu-install_*_all.deb');
                    console.log('3. sudo amdgpu-install --usecase=graphics,rocm');
                    console.log('4. Reboot your system');
                    console.log('\nDocumentation: https://rocm.docs.amd.com/en/latest/deploy/linux/quick_start.html\n');
                }
            }
        }
    }

    if (gpus.length == 0) {
        console.log('No GPUs detected')
    }
}

// Run the detection
await diagnoseGPU();
