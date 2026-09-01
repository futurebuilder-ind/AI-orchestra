import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface HardwareInfo {
  totalRamGB: number;
  cpuCores: number;
  cpuModel: string;
  gpuDetected: boolean;
  gpuName: string;
  gpuVramGB: number;
  recommendedModelSize: string;
  recommendations: string[];
}

export async function detectHardware(): Promise<HardwareInfo> {
  const cpus = os.cpus();
  const cpuCores = cpus.length;
  const cpuModel = cpus[0]?.model || 'Unknown CPU';
  const totalRamGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

  let gpuDetected = false;
  let gpuName = 'None';
  let gpuVramGB = 0;

  // Try running nvidia-smi for NVIDIA GPUs
  try {
    const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits');
    if (stdout.trim()) {
      const parts = stdout.split(',');
      gpuDetected = true;
      gpuName = parts[0]?.trim() || 'NVIDIA GPU';
      const vramMib = parseInt(parts[1]?.trim() || '0');
      gpuVramGB = Math.round(vramMib / 1024);
    }
  } catch (error) {
    // If nvidia-smi failed, try wmic on Windows
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync('wmic path win32_VideoController get name,AdapterRAM /value');
        const lines = stdout.split('\n');
        let tempName = '';
        let tempRamBytes = 0;

        for (const line of lines) {
          const clean = line.trim();
          if (clean.startsWith('Name=')) {
            tempName = clean.substring(5);
          }
          if (clean.startsWith('AdapterRAM=')) {
            tempRamBytes = parseInt(clean.substring(11) || '0');
          }
        }

        if (tempName && !tempName.toLowerCase().includes('microsoft') && !tempName.toLowerCase().includes('basic render')) {
          gpuDetected = true;
          gpuName = tempName;
          gpuVramGB = Math.round(tempRamBytes / (1024 * 1024 * 1024));
        }
      } catch (wmicError) {
        // Ignore wmic errors and fallback
      }
    }
  }

  // Determine model size recommendation
  let recommendedModelSize = '1.5B - 3B (e.g. Qwen2.5-3B, Llama3.2-3B)';
  const recommendations: string[] = [];

  if (gpuDetected && gpuVramGB >= 6) {
    if (gpuVramGB >= 12) {
      recommendedModelSize = '8B - 14B (e.g. Llama3.1-8B, Qwen2.5-14B)';
      recommendations.push(`Detected premium GPU: ${gpuName} with ${gpuVramGB}GB VRAM.`);
      recommendations.push('You can comfortably run 8B models (Llama 3.1) and up to 14B models (Qwen 2.5) with GPU acceleration.');
    } else {
      recommendedModelSize = '7B - 8B (e.g. Llama3.1-8B, Gemma2-9B)';
      recommendations.push(`Detected GPU: ${gpuName} with ${gpuVramGB}GB VRAM.`);
      recommendations.push('You can run 7B-9B parameter models locally with good performance.');
    }
  } else {
    // RAM based recommendation for CPU fallback
    if (totalRamGB >= 16) {
      recommendedModelSize = '7B - 8B (e.g. Llama3-8B, Qwen2.5-7B) on CPU';
      recommendations.push(`No powerful GPU found, but you have ${totalRamGB}GB RAM.`);
      recommendations.push('You can run 7B-8B models, but responses might be slow on CPU. Try smaller 3B models for faster speed.');
    } else {
      recommendedModelSize = '1.5B - 3B (e.g. Qwen2.5-1.5B, Llama3.2-3B) on CPU';
      recommendations.push(`Low RAM / CPU only: ${totalRamGB}GB RAM.`);
      recommendations.push('We strongly recommend smaller models under 4B parameters (like Qwen2.5-1.5B/3B, Llama3.2-3B) to avoid system lag.');
    }
  }

  return {
    totalRamGB,
    cpuCores,
    cpuModel,
    gpuDetected,
    gpuName,
    gpuVramGB,
    recommendedModelSize,
    recommendations
  };
}
