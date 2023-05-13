import axios, { type AxiosResponse } from "axios";
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
// import { checkChannel } from "../../utils/checkChannel";
import { getChannelData } from "../../utils/getChannelData.js";
import { readJsonFile, writeToJsonFile } from "../../utils/json.js";
import { validateChannel } from "../../utils/validateChannel.js";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Watch a YouTube channel's subscriber count.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("A YouTube channel's name, ID, or URL.")
        .setAutocomplete(true)
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
  autocomplete: async ({ interaction }) => {
    const focusedValue = interaction.options.getFocused() || "mrbeast";
    const { data } = await axios.get<
      any,
      AxiosResponse<{
        results: { name: string; id: string; mainCount: number }[];
      }>
    >(
      `https://livecounts.xyz/api/youtube-live-subscriber-count/search/${focusedValue}`
    );
    await interaction.respond(
      data.results.map((channel) => ({
        name: `${channel.name} • ${abbreviate(channel.mainCount)} subscribers`,
        value: channel.id,
      }))
    );
  },
  run: async ({ /* client, */ interaction }) => {
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

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    // just for typesafety
    if (!channel || !channel.isTextBased()) return;

    if (
      !channel.permissionsFor(interaction.guild.members.me!).has("SendMessages")
    )
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription("I can't send messages in that channel.")
            .setColor("Red"),
        ],
      });

    const serverChannels = fs
      .readdirSync("./data/channels")
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

    const data = await getChannelData(id);

    const allChannels = fs.readdirSync("./data/channels");
    const thisChannel = allChannels.find((x) => x.split(".json")[0] === id);
    if (!thisChannel)
      writeToJsonFile<Channel>(`./data/channels/${id}.json`, {
        name: data.title,
        lastCount: data.stats.subscriberCount,
        lastSubsPerDay: 0,
        lastAPIUpdate: 0,
        guilds: [{ id: interaction.guild.id, channel: channel.id }],
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
            "Started tracking. To stop tracking, run </unwatch:1077852487094108160>."
          )
          .setColor("White"),
      ],
      ephemeral: true,
    });

    channel.send({
      content: `📈 **${interaction.user.tag}** started tracking **${
        data.title
      }**${data.handle ? ` (${data.handle})` : ""}.`,
    });
  },
});
