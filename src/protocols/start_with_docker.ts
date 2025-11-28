import { $ } from 'bun'
import { buildComposeFile } from '../build_compose_file'
import { installDocker } from '../install_docker.mjs'
import { pullModel } from '../pull_model.mjs'

await installDocker()

await buildComposeFile()

await $`docker compose up -d`

await pullModel()
