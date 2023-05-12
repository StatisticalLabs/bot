import fs from "fs";
import { Event } from "../structures/Event";
import type { Reactions } from "../types/User";

export default new Event({
  name: "messageReactionRemove",
  run: (_, reaction, user) => {
    if (reaction.partial) reaction.fetch();
    if (reaction.message.partial) reaction.message.fetch();
    if (user.partial) user.fetch();

    let data: Reactions | null = null;
    try {
      data = require(`../../data/reactions/${user.id}-${
        reaction.message.guild!.id
      }.json`);
    } catch {
      // data is null
    }

    if (!data) return;

    data.reactions -= 1;
    fs.writeFileSync(
      `./data/reactions/${user.id}-${reaction.message.guild!.id}.json`,
      JSON.stringify(data, null, 2)
    );
  },
});
