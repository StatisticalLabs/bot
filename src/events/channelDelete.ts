import fs from "fs";
import { Event } from "../structures/Event.js";
import type { Channel } from "../types/Channel.js";
import { readJsonFile } from "../utils/readJsonFile.js";

export default new Event({
  name: "channelDelete",
  run: (client, channel) => {
    if (!channel.isTextBased() || channel.isDMBased()) return;

    const channels = fs
      .readdirSync("./data/channels")
      .filter((file) =>
        (readJsonFile<Channel>(`../../data/channels/${file}`)).guilds.find(
          (x) => x.id === channel.guild.id && x.channel === channel.id
        )
      );

    if (channels && channels.length) {
      for (const ytChannel of channels) {
        const data = readJsonFile<Channel>(`../../data/channels/${ytChannel}`);
        const filteredGuilds = data.guilds.filter(
          (x) => x.id !== channel.guild.id && x.channel !== channel.id
        );
        data.guilds = filteredGuilds;
        fs.writeFileSync(
          `./data/channels/${ytChannel}`,
          JSON.stringify(data, null, 2)
        );
      }
    }
  },
});
