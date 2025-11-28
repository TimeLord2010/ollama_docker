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
    }

    if (gpus.length == 0) {
        console.log('No GPUs detected')
    }
}

// Run the detection
await diagnoseGPU();
