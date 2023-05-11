import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { abbreviate } from "../../utils/abbreviate";
import { getChannelData } from "../../utils/getChannelData";
import { handleUrl, legacyUrl } from "../../utils/regex";
// const channels = require("../../schemas/channels");
import axios, { AxiosResponse } from "axios";
import fs from "fs";
import { Command } from "../../structures/Command";
import { Channel } from "../../types/Channel";
import { checkChannel } from "../../utils/checkChannel";
import { validateChannel } from "../../utils/validateChannel";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("unwatch")
    .setDescription("Stop watching a YouTube channel's subscriber count.")
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
          "The text channel to stop watching the YouTube channel from."
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
  run: async ({ client, interaction }) => {
    await interaction.deferReply({
      ephemeral: true
    })

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

    if (!channel || !channel.isTextBased()) return;

    const data = await getChannelData(id);

    const allChannels = fs.readdirSync("./data/channels");
    const thisChannel = allChannels.find((x) => x.split(".json")[0] === id);
    if (!thisChannel)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription("That channel has never been watched.")
            .setColor("Red"),
        ],
      });
    else {
      const data = require(`../../../data/channels/${id}.json`) as Channel;
      if (
        !data.guilds.find(
          (x) => x.id === interaction.guild.id && x.channel === channel.id
        )
      )
        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                "That channel has not been watched on this channel."
              )
              .setColor("Red"),
          ],
          ephemeral: true,
        });
      const filteredGuilds = data.guilds.filter(
        (x) => x.id !== interaction.guild.id && x.channel !== channel.id
      );
      data.guilds = filteredGuilds;
      fs.writeFileSync(
        `./data/channels/${id}.json`,
        JSON.stringify(data, null, 2)
      );
    }

    interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${data.title}${data.handle ? ` (${data.handle})` : ""}`,
            iconURL: `https://www.banner.yt/${id}/avatar`,
          })
          .setDescription("Stopped tracking.")
          .setColor("White"),
      ],
      ephemeral: true,
    });

    channel.send({
      content: `📉 **${interaction.user.tag}** stopped tracking **${
        data.title
      }**${data.handle ? ` (${data.handle})` : ""}.`,
    });
  },
});
