import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import { CHANNEL_LIMIT } from "../../constants.js";
import { Command } from "../../structures/Command.js";
import type { Channel } from "../../types/Channel.js";
import { abbreviate } from "../../utils/abbreviate.js";
import { channelAutocomplete } from "../../utils/autocomplete.js";
import { getChannelData } from "../../utils/getChannelData.js";
import { readJsonFile, writeToJsonFile } from "../../utils/json.js";
import { validateChannel } from "../../utils/validateChannel.js";

function unabbreviate(number: string) {
  const base = parseInt(number);
  if (number.toLowerCase().match(/k/i)) return Math.round(base * 1000);
  else if (number.toLowerCase().match(/m/i)) return Math.round(base * 1000000);
  else if (number.toLowerCase().match(/b/i))
    return Math.round(base * 1000000000);
  else return base;
}

export default new Command({
  data: new SlashCommandBuilder()
    .setName("milestone")
    .setDescription("Watch for a specific milestone on a YouTube channel.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("A YouTube channel's name, ID, or URL.")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("milestone")
        .setDescription("The milestone you want to track.")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "The text channel to send the YouTube channel's new subscriber counts in."
        )
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  autocomplete: async ({ interaction }) => channelAutocomplete(interaction),
  run: async ({ interaction }) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const query = interaction.options.getString("query", true);
    let id = "";
    const validated = await validateChannel(query);
    if (validated.error)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder().setDescription(validated.message).setColor("Red"),
        ],
        ephemeral: true,
      });
    else id = validated.id;

    const data = await getChannelData(id);

    const milestone = unabbreviate(
      interaction.options.getString("milestone", true)
    );
    if (milestone === data.stats.subscriberCount)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "The milestone must be greater/less than the current count."
            )
            .setColor("Red"),
        ],
        ephemeral: true,
      });

    const serverChannels = fs
      .readdirSync("./data/channels")
      .filter((file) => file.endsWith(".json"))
      .filter((file) =>
        readJsonFile<Channel>(`../../../data/channels/${file}`).guilds.find(
          (x) => x.id === interaction.guild.id
        )
      );

    if (serverChannels.length > CHANNEL_LIMIT)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `This server has reached the limit of ${CHANNEL_LIMIT.toLocaleString()} channels.`
            )
            .setColor("Red"),
        ],
      });

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    // just for typesafety
    if (!channel || !channel.isTextBased()) return;

    const allChannels = fs
      .readdirSync("./data/channels")
      .filter((file) => file.endsWith(".json"));
    const thisChannel = allChannels.find((x) => x.split(".json")[0] === id);
    if (!thisChannel)
      writeToJsonFile<Channel>(`./data/channels/${id}.json`, {
        name: data.title,
        lastCount: data.stats.subscriberCount,
        lastSubsPerDay: 0,
        lastAPIUpdate: 0,
        guilds: [{ id: interaction.guild.id, channel: channel.id, milestone }],
        previousUpdates: [],
      });
    else {
      const data = readJsonFile<Channel>(`../../../data/channels/${id}.json`);
      if (
        data.guilds.find(
          (x) => x.id === interaction.guild.id && x.channel === channel.id
        )
      )
        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                "That channel is already being watched in this channel."
              )
              .setColor("Red"),
          ],
        });
      data.guilds.push({
        id: interaction.guild.id,
        channel: channel.id,
        milestone,
      });
      writeToJsonFile(`./data/channels/${id}.json`, data);
    }

    interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${data.title}${data.handle ? ` (${data.handle})` : ""}`,
            iconURL: `https://www.banner.yt/${id}/avatar`,
          })
          .setDescription(
            `Started tracking for ${abbreviate(
              milestone
            )} subscribers. To stop tracking, run </unwatch:1077852487094108160>.`
          )
          .setColor("White"),
      ],
      ephemeral: true,
    });

    channel.send({
      content: `📈 **${interaction.user.tag}** started tracking **${
        data.title
      }**${data.handle ? ` (${data.handle})` : ""} for ${abbreviate(
        milestone
      )} subscribers.`,
    });
  },
});
