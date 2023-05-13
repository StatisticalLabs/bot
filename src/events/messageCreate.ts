import { Event } from "../structures/Event.js";
import type { Messages } from "../types/User.js";
import { readJsonFile, writeToJsonFile } from "../utils/json.js";

export default new Event({
  name: "messageCreate",
  run: async (_, message) => {
    if (message.author.bot || !message.inGuild()) return;

    let data: Messages | null = null;
    try {
      data = readJsonFile<Messages>(
        `../../data/messages/${message.author.id}-${message.guild.id}.json`
      );
    } catch {
      // data is null
    }

    if (!data)
      writeToJsonFile<Messages>(
        `./data/messages/${message.author.id}-${message.guild.id}.json`,
        {
          messages: 1,
          characters: message.content.split("").length,
        }
      );
    else {
      data.messages += 1;
      data.characters += message.content.split("").length;
      writeToJsonFile(
        `./data/messages/${message.author.id}-${message.guild.id}.json`,
        data
      );
    }
  },
});
