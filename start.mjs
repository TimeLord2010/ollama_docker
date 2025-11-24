import { $ } from 'bun'
import { installDocker } from './src/install_docker.mjs'
import { pullModel } from './src/pull_model.mjs'

await installDocker()

await $`docker compose up -d`

await pullModel()