import fs from 'fs';
import { Event } from "../structures/Event";
import { Channel } from "../types/Channel";

export default new Event({
  name: "channelDelete",
  run: (client, channel) => {
    if(!channel.isTextBased() || channel.isDMBased()) return;

    const channels = fs.readdirSync("./data/channels").filter((file) => (require(`../../data/channels/${file}`) as Channel).guilds.find((x) => x.id === channel.guild.id))

    if(channels && channels.length) {
      for(const ytChannel of channels) {
        const data = require(`../../data/channels/${ytChannel}`) as Channel
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
  }
})