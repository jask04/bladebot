import { Collection } from 'discord.js';
import { Command } from '../commands/command.interface';

export const commands = new Collection<string, Command>();
