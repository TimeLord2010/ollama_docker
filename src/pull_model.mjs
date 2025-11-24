import { $ } from 'bun'

export async function pullModel(name = 'qwen3:0.6b') {
    console.log(`Pulling AI model ${name}`)
    await $`docker exec ollama ollama pull ${name}`
}