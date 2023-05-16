import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../structures/Command";
import type { ServerSettings } from "../../types/ServerSettings";
import { readJsonFile } from "../../utils/json";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("optout")
    .setDescription("Opt out of statistics.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  run: ({ interaction }) => {
    let data: ServerSettings = { trackStats: true };
    try {
      data = readJsonFile<ServerSettings>(
        `../../../data/serversettings/${interaction.guild.id}`
      );
    } catch {
      // data is set to a default value
    }

    if (data.trackStats) data.trackStats = false;
    else data.trackStats = true;

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${data.trackStats ? "Enabled" : "Disabled"} server statistics!`
          )
          .setColor("Green"),
      ],
      ephemeral: true,
    });
  },
});
