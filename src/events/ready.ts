import axios, { AxiosError } from "axios";
import { CronJob } from "cron";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import fs from "fs";
import parseMs from "parse-ms";
import server from "../server.js";
import { Event } from "../structures/Event.js";
import type { Channel } from "../types/Channel.js";
import { abbreviate } from "../utils/abbreviate.js";
// import { checkChannel } from "../utils/checkChannel";
import type { BotClient } from "../structures/Client.js";
import { env } from "../utils/env.js";
import { getChannelData, type ChannelData } from "../utils/getChannelData.js";
import { readJsonFile, writeToJsonFile } from "../utils/json.js";

function convertToReadable(timestamp: number) {
  const pluralize = (word: string, count: number) =>
    count === 1 ? word : `${word}s`;

  const parsed = parseMs(timestamp);
  const string = [];
  if (parsed.days)
    string.push(`${parsed.days} ${pluralize("day", parsed.days)}`);
  if (parsed.hours)
    string.push(`${parsed.hours} ${pluralize("hour", parsed.hours)}`);
  if (parsed.minutes)
    string.push(`${parsed.minutes} ${pluralize("minute", parsed.minutes)}`);
  if (parsed.seconds)
    string.push(`${parsed.seconds} ${pluralize("second", parsed.seconds)}`);

  if (!string.length) return "0 seconds";

  return string.join(", ");
}

export default new Event({
  name: "ready",
  run: (client) => {
    console.log(`Logged in as ${client.user.tag}.`);
    server(client);

    // new CronJob(
    //   "*/5 * * * * *",
    //   checkChannels,
    //   null,
    //   true,
    //   "America/Los_Angeles"
    // );

    setInterval(checkChannels, 5 * 1000);
    // setInterval(reverseCheckChannels, 20 * 1000)

    // for (const [channelID] of fs.readdirSync("./data/channels").map((channel) => channel.split('.json'))) {
    //   new CronJob(
    //     "*/10 * * * * *",
    //     async () => checkChannel(client, channelID),
    //     null,
    //     true,
    //     "America/Los_Angeles"
    //   );
    // }

    if (env.BETTERUPTIME_URL) {
      new CronJob(
        "* * * * *",
        () => {
          axios.get(env.BETTERUPTIME_URL!);
          console.log("Sent status to BetterUptime.");
        },
        null,
        true,
        "America/Los_Angeles"
      );
    }

    async function checkChannels() {
      const allChannels = fs
        .readdirSync("./data/channels")
        .filter((file) => file.endsWith(".json"));
      for (const chnl of allChannels) {
        const channel = readJsonFile<Channel>(`../../data/channels/${chnl}`);
        const channelID = chnl.split(".json")[0];
        try {
          const data = await getChannelData(channelID).catch(() => null);
          if (!data) continue;
          validateChannel(client, data, channel, channelID);
        } catch (err) {
          if (err instanceof AxiosError && err.response?.status === 520)
            continue;
          console.error(err);
          continue;
        }
      }
    }
  },
});

function validateChannel(
  client: BotClient<true>,
  data: ChannelData,
  channel: Channel,
  channelID: string
) {
  if (channel.lastCount === data.stats.subscriberCount) return;

  const diffTime = Math.abs(
    new Date().getTime() - new Date(channel.lastAPIUpdate).getTime()
  );
  const subsPerDay =
    ((data.stats.subscriberCount - channel.lastCount) / (diffTime / 1000)) *
    (60 * 60 * 24);

  const title = `New subscriber update for ${data.title}${
    data.handle ? ` (${data.handle})` : ""
  }`;

  const embed = new EmbedBuilder()
    .setTitle(title.length > 255 ? title.substring(0, 255).concat("-") : title)
    .setURL(`https://youtube.com/channel/${channelID}`)
    .addFields(
      {
        name: "Old API Count",
        value: channel.lastCount === 0 ? "None" : abbreviate(channel.lastCount),
        inline: true,
      },
      {
        name: "New API Count",
        value: abbreviate(data.stats.subscriberCount),
        inline: true,
      },
      {
        name: "Time",
        value: `<t:${Math.round(new Date().getTime() / 1000)}:F>`,
      },
      {
        name: "Last Milestone Time",
        value: `<t:${Math.round(
          new Date(channel.lastAPIUpdate).getTime() / 1000
        )}:F>`,
      },
      {
        name: "How Long",
        value: `${convertToReadable(
          channel.lastAPIUpdate === 0
            ? 0
            : new Date().getTime() - new Date(channel.lastAPIUpdate).getTime()
        )}`,
        inline: true,
      },
      {
        name: `Subscribers per day ${
          channel.lastSubsPerDay !== 0
            ? subsPerDay - channel.lastSubsPerDay < 0
              ? "(⬇️)"
              : subsPerDay - channel.lastSubsPerDay === 0
                ? ""
                : "(⬆️)"
            : ""
        }`,
        value: `${abbreviate(subsPerDay)} (${
          subsPerDay === channel.lastSubsPerDay
            ? ""
            : subsPerDay - channel.lastSubsPerDay < 0
              ? ""
              : "+"
        }${abbreviate(subsPerDay - channel.lastSubsPerDay)})`,
        inline: true,
      }
    )
    .setThumbnail(data.avatar)
    .setColor("White")
    .setFooter({
      text: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    });

  const milestoneTitle = `${data.title}${
    data.handle ? ` (${data.handle})` : ""
  } has hit ${abbreviate(data.stats.subscriberCount)} subscribers!`;

  const milestoneEmbed = new EmbedBuilder()
    .setTitle(
      milestoneTitle.length > 255
        ? milestoneTitle.substring(0, 255).concat("-")
        : milestoneTitle
    )
    .setDescription(
      milestoneTitle.length > 255 ? `...${milestoneTitle.slice(255)}` : null
    )
    .setURL(`https://youtube.com/channel/${channelID}`)
    .addFields(
      {
        name: "Time",
        value: `<t:${Math.round(new Date().getTime() / 1000)}:F>`,
      },
      {
        name: "Last Update Time",
        value: `<t:${Math.round(
          new Date(channel.lastAPIUpdate).getTime() / 1000
        )}:F>`,
      },
      {
        name: "How Long",
        value: `${convertToReadable(
          channel.lastAPIUpdate === 0
            ? 0
            : new Date().getTime() - new Date(channel.lastAPIUpdate).getTime()
        )}`,
        inline: true,
      },
      {
        name: `Subscribers per day ${
          channel.lastSubsPerDay !== 0
            ? subsPerDay - channel.lastSubsPerDay < 0
              ? "(⬇️)"
              : subsPerDay - channel.lastSubsPerDay === 0
                ? ""
                : "(⬆️)"
            : ""
        }`,
        value: `${abbreviate(subsPerDay)} (${
          subsPerDay === channel.lastSubsPerDay
            ? ""
            : subsPerDay - channel.lastSubsPerDay < 0
              ? ""
              : "+"
        }${abbreviate(subsPerDay - channel.lastSubsPerDay)})`,
        inline: true,
      }
    )
    .setThumbnail(data.avatar)
    .setColor("White")
    .setFooter({
      text: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    });

  const lastCount = channel.lastCount;

  // backup in case a channel doesn't have a name in the db yet
  // we're saving in the db so I don't need to fetch it 10x in other commands
  if (!channel.name || channel.name !== data.title) channel.name = data.title;
  channel.lastCount = data.stats.subscriberCount;
  channel.lastAPIUpdate = Date.now();
  channel.lastSubsPerDay = subsPerDay;
  if (!channel.previousUpdates)
    channel.previousUpdates = [
      {
        time: Date.now(),
        count: data.stats.subscriberCount,
        subsPerDay,
      },
    ];
  else
    channel.previousUpdates.push({
      time: Date.now(),
      count: data.stats.subscriberCount,
      subsPerDay,
    });
  writeToJsonFile(`./data/channels/${channelID}.json`, channel);

  for (const channelGuild of channel.guilds) {
    const guild = client.guilds.cache.get(channelGuild.id);
    if (!guild) return;

    const textChannel = guild.channels.cache.get(channelGuild.channel);
    if (
      !textChannel ||
      !textChannel.isTextBased() ||
      !textChannel
        .permissionsFor(guild.members.me!)
        .has(["SendMessages", "EmbedLinks", "AttachFiles"])
    )
      return;

    if (
      channelGuild.milestone &&
      data.stats.subscriberCount === channelGuild.milestone
    ) {
      textChannel
        .send({
          embeds: [milestoneEmbed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(
                  `info-${channelID}:${diffTime}:${data.stats.subscriberCount}:${lastCount}`
                )
                .setLabel("View extra info")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`graph-${channelID}`)
                .setLabel("View growth graphs")
                .setStyle(ButtonStyle.Primary)
            ),
          ],
        })
        .catch((err) => console.error(err));

      const filteredGuilds = channel.guilds.filter(
        (x) =>
          x.id !== guild.id &&
          x.channel !== textChannel.id &&
          x?.milestone !== channelGuild.milestone
      );
      channel.guilds = filteredGuilds;
      writeToJsonFile(`./data/channels/${channelID}.json`, channel);
    } else {
      textChannel
        .send({
          // content:
          //   channel.lastCount === 0
          //     ? "This is the first time this channel is being watched."
          //     : "",
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(
                  `info-${channelID}:${diffTime}:${data.stats.subscriberCount}:${lastCount}`
                )
                .setLabel("View extra info")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`graph-${channelID}`)
                .setLabel("View growth graphs")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`unwatch-${channelID}`)
                .setLabel("Stop watching this channel")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        })
        .catch((err) => console.error(err));
    }
  }
}
