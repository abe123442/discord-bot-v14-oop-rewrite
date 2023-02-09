import { Client, ClientOptions, Collection, GatewayIntentBits, Partials } from 'discord.js'
import config, { IConfig } from '../config.js'
import Logger from './Logger.js'

const clientOptions: ClientOptions = {
  allowedMentions: {
    parse: ['users'],
    repliedUser: false,
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
}

export default class BotClient extends Client {
  logger: Logger
  config: IConfig
  commands: Collection<any, any> // need to change this

  constructor() {
    super(clientOptions)
    this.config = config
    this.logger = new Logger({
      displayTimestamp: true,
      displayDate: true,
    })
    this.commands = new Collection();
  }

  async loadCommands() {

  }

  async start() {
    super.login(this.config.token)
    this.loadCommands();
  }
}