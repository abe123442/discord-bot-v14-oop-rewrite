import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  Collection, 
  PermissionResolvable, 
  Message, 
  AutocompleteInteraction
} from 'discord.js'

export interface SlashCommand {
    command: SlashCommandBuilder,
    execute: (interaction: CommandInteraction) => void,
    autocomplete?: (interaction: AutocompleteInteraction) => void,
    cooldown?: number // in seconds
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string,
            APP_ID: string
        }
    }
}

declare module 'discord.js' {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>
        cooldowns: Collection<string, number>
    }
}