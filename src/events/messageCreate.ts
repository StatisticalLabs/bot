import fs from "fs";
import { Event } from "../structures/Event";
import type { Messages } from "../types/User";

export default new Event({
  name: "messageCreate",
  run: async (_, message) => {
    if (message.author.bot || !message.inGuild()) return;

    let data: Messages | null = null;
    try {
      data = require(`../../data/messages/${message.author.id}-${message.guild.id}.json`);
    } catch {
      // data is null
    }

    if (!data)
      fs.writeFileSync(
        `./data/messages/${message.author.id}-${message.guild.id}.json`,
        JSON.stringify(
          {
            messages: 1,
            characters: message.content.split("").length,
          },
          null,
          2
        )
      );
    else {
      data.messages += 1;
      data.characters += message.content.split("").length;
      fs.writeFileSync(
        `./data/messages/${message.author.id}-${message.guild.id}.json`,
        JSON.stringify(data, null, 2)
      );
    }
  },
});
