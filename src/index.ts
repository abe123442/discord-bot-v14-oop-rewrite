import { BotClient } from './structures/Client.js'

export const client = new BotClient()

const startBot = async () => {
  await client.start()
}

startBot()