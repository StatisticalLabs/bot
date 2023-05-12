import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import { Command } from "../../structures/Command";
import type { Channel } from "../../types/Channel";
import { abbreviate } from "../../utils/abbreviate";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("watching")
    .setDescription("View all the channels that are being watched.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to get the watch list of.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),
  run: async ({ interaction }) => {
    const res = await interaction.deferReply({
      ephemeral: true,
      fetchReply: true,
    });

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    if (!channel || !channel.isTextBased()) return;

    const allChannels = fs
      .readdirSync("./data/channels")
      .map((channelID) => ({
        channelID: channelID.split(".json")[0],
        ...(require(`../../../data/channels/${channelID}`) as Channel),
      }))
      .filter((data) => {
        return data.guilds.find(
          (x) => x.id === interaction.guild.id && x.channel === channel.id
        )
          ? true
          : false;
      });
    if (!allChannels.length)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `No channels are being watched in #${channel.name}.`
            )
            .setColor("Red"),
        ],
      });

    const embeds: EmbedBuilder[] = [];
    let k = 10;
    for (let i = 0; i < allChannels.length; i += 10) {
      const chnls = allChannels;
      const current = chnls
        .sort((a, b) => b.lastCount - a.lastCount)
        .slice(i, k);
      let j = i;
      const info = current
        .map((channel) => `${channel.name} (${abbreviate(channel.lastCount)})`)
        .map((info) => `**${++j}**. ${info}`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`📑 Channels being watched in #${channel.name}`)
        .setDescription(info)
        .setColor("White")
        .setFooter({
          text: `${allChannels.length} channels in total.`,
          iconURL: interaction.guild.iconURL() ?? undefined,
        });
      embeds.push(embed);
      k += 10;
    }

    const getRow = (cur: number) => {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("994438542077984768")
          .setDisabled(cur === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("994438540429643806")
          .setDisabled(cur === embeds.length - 1)
      );

      return row;
    };

    let cur = 0;
    await interaction.followUp({
      embeds: [embeds[0]],
      components: [getRow(cur)],
      ephemeral: true,
      fetchReply: true,
    });

    const collector = res.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (i) => {
      if (i.customId !== "prev" && i.customId !== "next") return;

      if (i.customId === "prev" && cur > 0) {
        cur -= 1;
        i.update({
          embeds: [embeds[cur]],
          components: [getRow(cur)],
        });
      } else if (i.customId === "next" && cur < embeds.length - 1) {
        cur += 1;
        i.update({
          embeds: [embeds[cur]],
          components: [getRow(cur)],
        });
      }
    });
  },
});
