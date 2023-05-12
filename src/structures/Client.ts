import InfinityAutoPoster from "@infinitybots/autoposter";
import type {
  ApplicationCommandDataResolvable,
  ClientOptions,
} from "discord.js";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import fs from "fs";
import path from "path";
import { DJSPoster as TopggAutoPoster } from "topgg-autoposter";
import { env } from "../utils/env";
import type { CommandData } from "./Command";

type BotOptions = Omit<ClientOptions, "intents" | "partials">;

export class BotClient<Ready extends boolean = boolean> extends Client<Ready> {
  commands = new Collection<string, CommandData>();

  constructor(options?: BotOptions) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [Partials.Message, Partials.Reaction, Partials.User],
      ...options,
    });
  }

  connect() {
    this.login(env.TOKEN);

    if (env.TOPGG_TOKEN) {
      const topggPoster = new TopggAutoPoster(env.TOPGG_TOKEN, this, {
        startPosting: true,
      });
      topggPoster.on("posted", () =>
        console.log("Posted stats to Top.gg API.")
      );
    }

    if (env.INFINITYBOTS_TOKEN) {
      const infinityPoster = InfinityAutoPoster(env.INFINITYBOTS_TOKEN, this, {
        startNow: true,
      });
      infinityPoster.on("posted", () =>
        console.log("Posted stats to Infinity Bots API.")
      );
    }
  }

  async register() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    async function registerCommands() {
      const commands: ApplicationCommandDataResolvable[] = [];
      fs.readdirSync(path.join(__dirname, "../commands")).forEach(
        async (dir) => {
          const commandFiles = fs
            .readdirSync(path.join(__dirname, `../commands/${dir}`))
            .filter((file) => file.endsWith("ts") || file.endsWith("js"));

          for (const file of commandFiles) {
            const command = await import(`../commands/${dir}/${file}`)
              .then((x) => x?.default)
              .catch(() => null);
            if (!command?.data || !command?.run) continue;

            self.commands.set(command.data.toJSON().name, command);
            commands.push({
              ...command.data.toJSON(),
              dmPermission: false,
            });
          }
        }
      );

      self.on("ready", async () => {
        // if (config.guildId && config.guildId.length) {
        //   const guild = this.guilds.cache.get(config.guildId);
        //   if (!guild)
        //     throw new SyntaxError(`No guild found with ID ${config.guildId}.`);

        //   guild.commands.set(commands);
        //   console.log(`Registered commands in ${guild.name}.`);
        // } else {
        self.application?.commands.set(commands);
        console.log("Registered commands globally.");
        // }
      });
    }

    async function registerEvents() {
      const eventFiles = fs
        .readdirSync(path.join(__dirname, "../events"))
        .filter((file) => file.endsWith("ts") || file.endsWith("js"));

      for (const file of eventFiles) {
        const event = await import(`../events/${file}`)
          .then((x) => x?.default)
          .catch(() => null);
        if (!event?.name || !event?.run) continue;

        self.on(event.name, event.run.bind(null, self));
      }
    }

    await registerCommands();
    await registerEvents();
  }
}
