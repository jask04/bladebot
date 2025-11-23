import { Message, Client } from 'discord.js';

export interface Command {
  name: string;
  description: string;
  details?: string;
  usage?: string;
  examples?: string[];
  execute: (message: Message, args: string[], client: Client) => Promise<void>;
}
