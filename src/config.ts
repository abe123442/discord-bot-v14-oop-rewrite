import 'dotenv/config'

export interface IConfig {
  token: string
  clientId: string
  ownerID: string | string[]
  color: {
    default: string
    error: string
    success: string
    info: string
    warn: string
  }
  production: string | boolean
  guildId: string
}

const config: IConfig = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.APP_ID || '',
  // prefix: process.env.PREFIX || '*',
  ownerID: process.env.OWNER_ID || ['473221703418511360'],

  color: {
    default: process.env.DEFAULT_COLOR || '#00FF00',
    error: process.env.ERROR_COLOR || '#FF0000',
    success: process.env.SUCCESS_COLOR || '#00FF00',
    info: process.env.INFO_COLOR || '#00FFFF',
    warn: process.env.WARN_COLOR || '#FFFF00',
  },
  production: process.env.PRODUCTION || false,
  guildId: process.env.GUILD_ID || '1069138490278821938'
}

export default config
