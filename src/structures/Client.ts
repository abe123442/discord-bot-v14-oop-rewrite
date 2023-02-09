import { Client, ClientOptions, Collection, Events, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } from 'discord.js'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))


import Logger from './Logger.js'

import config, { IConfig } from '../config.js'
import { SlashCommand } from '../types.js'
import { join } from 'path'

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

export class BotClient extends Client {
  logger: Logger
  config: IConfig
  commands: Collection<string, SlashCommand>

  constructor() {
    super(clientOptions)
    this.config = config
    this.logger = new Logger({
      displayTimestamp: true,
      displayDate: true,
    })
    this.commands = new Collection()
  }

  async loadCommands() {
    let commandCounter = 0
    
    const commandsDir = join(__dirname, '../commands')
    const commandFiles = readdirSync(commandsDir).filter(file => file.endsWith('.js'))

    try {
      for (const file of commandFiles) {
        const filePath = join(commandsDir, file)
        let ImportedCommand = await import(filePath)
        ImportedCommand = ImportedCommand.default as SlashCommand
        this.commands.set(ImportedCommand.command.name, ImportedCommand)
        commandCounter += 1
      }
    } catch (error) {
      this.logger.error(error)
    }

    this.logger.success(`Successfully loaded ${commandCounter} commands!`)
  }

  loadEvents() {
    super.on(Events.InteractionCreate, async interaction => {
      if (!interaction.isChatInputCommand()) return

      const command = this.commands.get(interaction.commandName)

      if (!command) return

      try {
        command.execute(interaction)
      } catch (error) {
        console.error(error)
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
      }
    })
  }

  async start() {
    super.once(Events.ClientReady, c => this.logger.success(`Ready! Logged in as ${c.user.tag}`))
    this.loadCommands()
    this.loadEvents()
    super.login(this.config.token)
  }
}