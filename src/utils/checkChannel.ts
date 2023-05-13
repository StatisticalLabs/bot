import { AxiosError } from "axios";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import parseMs from "parse-ms";
import type { BotClient } from "../structures/Client.js";
import type { Channel } from "../types/Channel.js";
import { abbreviate } from "./abbreviate.js";
import { getChannelData } from "./getChannelData.js";
import { readJsonFile, writeToJsonFile } from "./json.js";

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

// beta
export async function checkChannel(client: BotClient<true>, id: string) {
  const channel = readJsonFile<Channel>(`../../data/channels/${id}`);

  try {
    const data = await getChannelData(id).catch(() => null);
    if (!data) return;
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
      .setTitle(
        title.length > 255 ? title.substring(0, 255).concat("-") : title
      )
      .setURL(`https://youtube.com/channel/${id}`)
      .addFields(
        {
          name: "Old API Count",
          value:
            channel.lastCount === 0 ? "None" : abbreviate(channel.lastCount),
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
    writeToJsonFile(`./data/channels/${id}.json`, channel);

    for (const channelGuild of channel.guilds) {
      const guild = client.guilds.cache.get(channelGuild.id);
      if (!guild) continue;

      const textChannel = guild.channels.cache.get(channelGuild.channel);
      if (!textChannel || !textChannel.isTextBased()) continue;

      try {
        textChannel.send({
          // content:
          //   channel.lastCount === 0
          //     ? "This is the first time this channel is being watched."
          //     : "",
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(
                  `info-${id}:${diffTime}:${data.stats.subscriberCount}:${lastCount}`
                )
                .setLabel("View extra info")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`graph-${id}`)
                .setLabel("View growth graphs")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`unwatch-${id}`)
                .setLabel("Stop watching this channel")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 520) return;
    console.error(err);
    return;
  }
}
