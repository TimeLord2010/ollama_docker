import { $ } from 'bun'
import { buildComposeFile } from './src/build_compose_file.mjs'
import { installDocker } from './src/install_docker.mjs'
import { pullModel } from './src/pull_model.mjs'

await installDocker()

await buildComposeFile()

await $`docker compose up -d`

await pullModel()
