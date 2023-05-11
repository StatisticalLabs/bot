import { ActivityType } from "discord.js";
import { BotClient } from "./structures/Client";

const client = new BotClient({
  shards: "auto",
  allowedMentions: {
    parse: [],
    roles: [],
    users: [],
    repliedUser: true,
  },
  presence: {
    activities: [
      {
        name: "statistics",
        type: ActivityType.Watching,
      },
    ],
  },
});

client.connect();
client.register();
