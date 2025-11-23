import { Message, Client, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { Command } from './command.interface';
import { DateTime } from 'luxon';
import { db } from '../db/database';
import { config } from '../config';

export const scheduleCommand: Command = {
  name: 'schedule',
  description: 'Schedules a custom game (ARAM or Summoner\'s Rift).',
  details: `Schedules a new game.
  
**Arguments:**
- \`type\`: 'aram' or 'sr'/'rift'.
- \`time\`: Time of day (e.g., 8:00, 8pm, 20:00).

**Behavior:**
- Creates a signup message where users can react with 👍 to join.
- Asks the creator to choose a team generation method: **Random** or **Captains**.
- If the time is in the past relative to today, it schedules for tomorrow.`,
  usage: '*schedule <type> <time> [am/pm]',
  examples: [
    '*schedule aram 8:00',
    '*schedule aram 8:00pm',
    '*schedule aram 20:00',
    '*schedule sr 730',
    '*schedule rift 6:30 am'
  ],
  execute: async (message: Message, args: string[], client: Client) => {
    if (args.length < 2) {
      await message.reply('Invalid usage. Please use: `*schedule <type> <time>` (e.g., `*schedule aram 8:00`)');
      return;
    }

    let type = args[0]?.toLowerCase();
    let timeStr = args[1]?.toLowerCase();
    let modifier = args[2]?.toLowerCase(); // Check for separate "am" or "pm" argument

    console.log(`[Schedule Debug] Input: type=${type}, timeStr=${timeStr}, modifier=${modifier}`);

    if (type !== 'aram' && type !== 'sr' && type !== 'rift') {
      await message.reply('Invalid game type. Please use `aram`, `sr` or `rift`.');
      return;
    }

    // Extract AM/PM from timeStr if attached (e.g., "730am")
    let isAm = false;
    let isPm = false;

    if (modifier) {
      if (modifier === 'am') isAm = true;
      if (modifier === 'pm') isPm = true;
    } else {
      if (timeStr!.endsWith('am')) {
        isAm = true;
        timeStr = timeStr!.replace('am', '');
      } else if (timeStr!.endsWith('pm')) {
        isPm = true;
        timeStr = timeStr!.replace('pm', '');
      }
    }
    console.log(`[Schedule Debug] After AM/PM extraction: timeStr=${timeStr}, isAm=${isAm}, isPm=${isPm}`);

    // Parse HH:mm, H:mm, H, HHMM, HMM
    let hour: number;
    let minute: number = 0;

    const rawTime = timeStr!.replace(':', ''); // Remove colon if present
    
    // Check if it's a number after stripping am/pm
    if (!/^\d+$/.test(rawTime)) {
        await message.reply('Invalid time format. Please use format like `8:00`, `8`, `630`, or `1230`.');
        return;
    }

    const len = rawTime.length;

    if (len === 1 || len === 2) {
        // H or HH (e.g., "7", "12", "08")
        hour = parseInt(rawTime, 10);
    } else if (len === 3) {
        // HMM (e.g., "630" -> 6:30)
        hour = parseInt(rawTime.substring(0, 1), 10);
        minute = parseInt(rawTime.substring(1), 10);
    } else if (len === 4) {
        // HHMM (e.g., "1230" -> 12:30)
        hour = parseInt(rawTime.substring(0, 2), 10);
        minute = parseInt(rawTime.substring(2), 10);
    } else {
        await message.reply('Invalid time format. Too many digits.');
        return;
    }

    console.log(`[Schedule Debug] Parsed hour=${hour}, minute=${minute}`);

    // Determine if we need to prompt for AM/PM
    let finalHour = hour;
    let needsPrompt = false;

    if (isAm || isPm) {
       // Explicit AM/PM
       if (hour === 12) {
            finalHour = isPm ? 12 : 0; 
       } else {
            if (isPm && hour < 12) finalHour += 12;
            if (isAm && hour === 12) finalHour = 0; 
       }
       if (hour > 12) {
           finalHour = hour;
       }

    } else {
        if (hour > 12) {
            finalHour = hour;
        } else if (hour === 0) { 
            finalHour = 0;
        } else {
            needsPrompt = true;
        }
    }
    console.log(`[Schedule Debug] Pre-prompt finalHour=${finalHour}, needsPrompt=${needsPrompt}`);

    if (needsPrompt) {
        if (!(message.channel instanceof TextChannel)) {
             await message.reply('This command can only be used in text channels.');
             return;
        }

        const promptEmbed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('Select Time of Day')
            .setDescription(`Is **${hour}:${minute.toString().padStart(2, '0')}** AM or PM?`);
        
        const promptMessage = await message.channel.send({ embeds: [promptEmbed] });
        await promptMessage.react('☀️'); // AM
        await promptMessage.react('🌙'); // PM

        try {
            const filter = (reaction: any, user: any) => {
                return ['☀️', '🌙'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            const collected = await promptMessage.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] });
            const reaction = collected.first();

            if (!reaction) {
                await promptMessage.delete();
                return; 
            }

            const selectedPm = reaction.emoji.name === '🌙';
            if (hour === 12) {
                 finalHour = selectedPm ? 12 : 0;
            } else {
                 if (selectedPm && hour < 12) finalHour += 12;
                 if (!selectedPm && hour >= 12) finalHour = hour;
            }
            
            await promptMessage.delete();

        } catch (e) {
            await promptMessage.delete();
            await message.reply('Time selection timed out.');
            return;
        }
    }
    console.log(`[Schedule Debug] Post-prompt finalHour=${finalHour}`);

    // Construct DateTime in the configured timezone
    const now = DateTime.now().setZone(config.DEFAULT_TIMEZONE);
    let scheduledTime = now.set({
        hour: finalHour,
        minute: minute,
        second: 0,
        millisecond: 0
    });

    // If time is in the past, assume tomorrow
    if (scheduledTime < now) {
        scheduledTime = scheduledTime.plus({ days: 1 });
    }
    console.log(`[Schedule Debug] Final scheduledTime: ${scheduledTime.toISO()} (Local: ${scheduledTime.toFormat('yyyy-MM-dd HH:mm:ss')})`);
    // Create Final Schedule
    let gameTitle = `${type!.toUpperCase()} Custom Game Scheduled!`;
    if (type === 'sr' || type === 'rift') {
        gameTitle = 'Summoner\'s Rift Custom Game Scheduled!';
    }
    const embed = new EmbedBuilder()
    .setColor(type === 'aram' ? '#0099ff' : '#ff5733')
    .setTitle(gameTitle)
    .setDescription(`Game scheduled for <t:${Math.floor(scheduledTime.toSeconds())}:F>\n\nReact with 👍 to join!`)
    .addFields(
        { name: 'Time', value: scheduledTime.toFormat('h:mm a'), inline: true },
        { name: 'Type', value: type!.toUpperCase(), inline: true },
        { name: 'Players Joined', value: '0', inline: true },
        { name: 'Players', value: 'No players yet.', inline: false }
    );

    if (message.channel instanceof TextChannel) {
        const sentMessage = await message.channel.send({ embeds: [embed] });
        await sentMessage.react('👍');

        // Save to DB
        let gameId: number | bigint = 0;
        try {
            const insert = db.prepare('INSERT INTO games (type, scheduled_time, channel_id, message_id, creator_id) VALUES (?, ?, ?, ?, ?)');
            const info = insert.run(type, scheduledTime.toISO(), message.channelId, sentMessage.id, message.author.id);
            gameId = info.lastInsertRowid;
        } catch (error) {
            console.error('Failed to save game to DB:', error);
            await message.reply('Failed to save the schedule to the database.');
            return;
        }

        // Ask for Team Generation Method via Buttons
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('method_random')
                    .setLabel('Random Teams 🎲')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('method_captains')
                    .setLabel('Captains 👑')
                    .setStyle(ButtonStyle.Secondary)
            );

        const promptMsg = await message.channel.send({ 
            content: `<@${message.author.id}>, how should teams be generated?`, 
            components: [row] 
        });

        try {
            const confirmation = await promptMsg.awaitMessageComponent({ 
                filter: (i) => i.user.id === message.author.id && i.componentType === ComponentType.Button, 
                time: 60000 
            });

            let method = 'random';
            if (confirmation.customId === 'method_captains') {
                method = 'captains';
            }

            const update = db.prepare('UPDATE games SET generation_method = ? WHERE id = ?');
            update.run(method, gameId);

            // Update the original game embed with the chosen method
            const updatedEmbed = EmbedBuilder.from(embed); // Start from the initial embed
            updatedEmbed.addFields({ name: 'Team Method', value: method === 'random' ? 'Random 🎲' : 'Captains 👑', inline: true });
            await sentMessage.edit({ embeds: [updatedEmbed] });

            await confirmation.update({ content: `Team generation method set to: **${method === 'random' ? 'Random 🎲' : 'Captains 👑'}**`, components: [] });
            
            // Delete the prompt after a few seconds to clean up? Or keep as confirmation.
            setTimeout(() => promptMsg.delete().catch(() => {}), 5000);

        } catch (e) {
            await promptMsg.edit({ content: 'Team generation selection timed out. Defaulting to **Random**.', components: [] });
            setTimeout(() => promptMsg.delete().catch(() => {}), 5000);
        }

    } else {
         await message.reply('This command can only be used in text channels.');
    }
  },
};
