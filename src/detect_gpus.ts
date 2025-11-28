import { $ } from 'bun';

export async function detectGpus(): Promise<Igpu[]> {
    let gpus: Igpu[] = []

    // Check for NVIDIA GPU first
    const nvidiaCheck = await $`which nvidia-smi`.quiet().nothrow();

    if (nvidiaCheck.exitCode === 0) {
        // nvidia-smi exists, verify it can run
        const nvidiaInfo = await $`nvidia-smi --query-gpu=name --format=csv,noheader`.quiet().nothrow();

        if (nvidiaInfo.exitCode === 0) {
            const gpuName = nvidiaInfo.stdout.toString().trim();
            gpus.push({
                type: 'nvidia',
                name: gpuName,
                isConfigured: true, // nvidia-smi is available and working
            })
        }
    }

    // Check for AMD GPU using lspci
    const lspciCheck = await $`lspci | grep -i 'vga\|3d\|display'`.quiet().nothrow();

    if (lspciCheck.exitCode === 0) {
        const output = lspciCheck.stdout.toString();

        if (output.toLowerCase().includes('amd') || output.toLowerCase().includes('ati')) {
            // Try to get more details
            const amdDetails = output.split('\n').find(line =>
                line.toLowerCase().includes('amd') || line.toLowerCase().includes('ati')
            );

            let gpuName = 'AMD GPU';
            if (amdDetails) {
                const match = amdDetails.match(/:\s*(.+)/);
                const firstMatch = match?.[1];
                if (firstMatch) {
                    gpuName = firstMatch.trim();
                }
            }

            // Check if amdgpu driver is loaded
            const driverCheck = await $`lsmod | grep amdgpu`.quiet().nothrow();
            const isConfigured = driverCheck.exitCode === 0;
            if (isConfigured) {
                console.log("  Driver: amdgpu driver is loaded");
            }

            gpus.push({
                type: 'amd',
                name: gpuName,
                isConfigured, // true if amdgpu driver is loaded
            });
        }

        if (output.toLowerCase().includes('nvidia') && gpus.length === 0) {
            console.log("✓ NVIDIA GPU detected (via lspci)");

            const nvidiaDetails = output.split('\n').find(line =>
                line.toLowerCase().includes('nvidia')
            );

            let gpuName = 'NVIDIA GPU';
            if (nvidiaDetails) {
                const match = nvidiaDetails.match(/:\s*(.+)/);
                const firstMatch = match?.[1];
                if (firstMatch) {
                    gpuName = firstMatch.trim();
                }
            }

            // nvidia-smi not found. Install NVIDIA drivers for full support.

            gpus.push({
                type: 'nvidia',
                name: gpuName,
                isConfigured: false, // nvidia-smi not available
            });
        }
    }

    // No GPU detected
    // The system may be using integrated graphics or another GPU type.

    return gpus
}

interface Igpu {
    type: 'amd' | 'nvidia'
    name: string
    isConfigured: boolean
}
