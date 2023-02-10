import { Configuration, OpenAIApi } from 'openai'
import config from '../config.js';

export default class OpenAIApiResponse {
  openai: OpenAIApi

  constructor() {
    const configuration = new Configuration({
      apiKey: config.openaiToken,
    });
    this.openai = new OpenAIApi(configuration)
  }

  async getResponse(prompt: string) {
    const response = await this.openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0,
      max_tokens: 7,
    })
    return response
  }
}