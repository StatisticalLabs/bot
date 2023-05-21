import { ActivityType } from "discord.js";
import { BotClient } from "./structures/Client.js";

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

import process from "node:process";

process.on("unhandledRejection", (err) => console.error(err));
process.on("uncaughtException", (err) => console.error(err));
process.on("uncaughtExceptionMonitor", (err) => console.error(err));
