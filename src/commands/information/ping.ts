import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/Command.js";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pings the bot."),
  run: async ({ client, interaction }) => {
    const res = await interaction.deferReply({
      ephemeral: true,
      fetchReply: true,
    });

    const ping = res.createdTimestamp - interaction.createdTimestamp;

    interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setDescription(`🤖 ${ping}ms\n📶 ${client.ws.ping}ms`)
          .setColor("White"),
      ],
    });
  },
});
