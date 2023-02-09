import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js'
import { SlashCommand } from '../types.js'

const slashCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the bot\'s ping')
  ,
  execute: async (interaction: CommandInteraction) => (
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`)
      ]
    })
  ),
  cooldown: 10
}

export default slashCommand