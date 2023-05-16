import { Event } from "../structures/Event.js";
import type { Reactions } from "../types/User.js";
import { readJsonFile, writeToJsonFile } from "../utils/json.js";
import { optedOutOfStats } from "../utils/optedOutOfStats.js";

export default new Event({
  name: "messageReactionRemove",
  run: (_, reaction, user) => {
    if (reaction.partial) reaction.fetch();
    if (reaction.message.partial) reaction.message.fetch();
    if (user.partial) user.fetch();

    if (optedOutOfStats(reaction.message.guild!.id)) return;

    let data: Reactions | null = null;
    try {
      data = readJsonFile<Reactions>(
        `../../data/reactions/${user.id}-${reaction.message.guild!.id}.json`
      );
    } catch {
      // data is null
    }

    if (!data) return;

    data.reactions -= 1;
    writeToJsonFile(
      `./data/reactions/${user.id}-${reaction.message.guild!.id}.json`,
      data
    );
  },
});
