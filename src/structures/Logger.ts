import { Client, ShardClientUtil } from 'discord.js'
import { Signale } from 'signale'

const options = {
  disabled: false,
  interactive: false,
  logLevel: 'info',
  secrets: [],
  stream: process.stdout,
  types: {
    start: {
      badge: '✔️',
      color: 'green',
      label: 'start',
    }
  }
}

export default class Logger extends Signale {
  constructor(config: Object, client?: Client) {
    super({
      ...options,
      config: config,
      scope: (client ? `Shard ${('00' + (client.shard as ShardClientUtil).ids[0]).slice(-2)}` : 'Manager')
    })
  }
}