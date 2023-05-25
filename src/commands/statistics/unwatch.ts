import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import { Command } from "../../structures/Command.js";
import type { Channel } from "../../types/Channel.js";
import { getChannelData } from "../../utils/getChannelData.js";
// import { checkChannel } from "../../utils/checkChannel.js";
import { channelAutocomplete } from "../../utils/autocomplete.js";
import { readJsonFile, writeToJsonFile } from "../../utils/json.js";
import { validateChannel } from "../../utils/validateChannel.js";

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
  autocomplete: async ({ interaction }) => channelAutocomplete(interaction),
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

    if (!channel || !channel.isTextBased()) return;

    const data = await getChannelData(id);

    const allChannels = fs
      .readdirSync("./data/channels")
      .filter((file) => file.endsWith(".json"));
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
      const data = readJsonFile<Channel>(`../../../data/channels/${id}.json`);
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
      writeToJsonFile(`./data/channels/${id}.json`, data);
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
