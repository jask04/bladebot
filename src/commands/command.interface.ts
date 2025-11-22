import { Message, Client } from 'discord.js';

export interface Command {
  name: string;
  description: string;
  execute: (message: Message, args: string[], client: Client) => Promise<void>;
}
