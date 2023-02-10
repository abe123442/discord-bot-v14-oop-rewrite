import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js'
import { BaseSlashCommand } from '../types.js'

const slashCommand: BaseSlashCommand = {
  command: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the bot\'s ping')
  ,
  execute: async (interaction: CommandInteraction) => (
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`)
      ],
      ephemeral: true
    })
  ),
  cooldown: 10
}

export default slashCommand