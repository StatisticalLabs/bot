import fs from "fs";
import { Event } from "../structures/Event.js";
import type { Reactions } from "../types/User.js";
import { readJsonFile } from "../utils/readJsonFile.js";

export default new Event({
  name: "messageReactionAdd",
  /**
   * @param {import('discord.js').Client} _
   * @param {import('discord.js').MessageReaction} reaction
   * @param {import('discord.js').User} user
   */
  run: (_, reaction, user) => {
    if (reaction.partial) reaction.fetch();
    if (reaction.message.partial) reaction.message.fetch();
    if (user.partial) user.fetch();

    let data: Reactions | null = null;
    try {
      data = readJsonFile<Reactions>(`../../data/reactions/${user.id}-${
        reaction.message.guild!.id
      }.json`);
    } catch {
      // data is null
    }

    if (!data)
      fs.writeFileSync(
        `./data/reactions/${user.id}-${reaction.message.guild!.id}.json`,
        JSON.stringify(
          {
            reactions: 1,
          },
          null,
          2
        )
      );
    else {
      data.reactions += 1;
      fs.writeFileSync(
        `./data/messages/${user.id}-${reaction.message.guild!.id}.json`,
        JSON.stringify(data, null, 2)
      );
    }
  },
});
