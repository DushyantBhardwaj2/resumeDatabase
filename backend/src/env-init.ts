import { config } from "dotenv"
import { resolve } from "path"
import { existsSync } from "fs"

const devEnvPath = resolve(process.cwd(), ".env.development")
if (existsSync(devEnvPath)) {
  config({ path: devEnvPath })
}

config()
