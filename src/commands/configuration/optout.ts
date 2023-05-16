import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../structures/Command.js";
import type { ServerSettings } from "../../types/ServerSettings.js";
import { readJsonFile, writeToJsonFile } from "../../utils/json.js";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("optout")
    .setDescription("Opt out of statistics.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  run: ({ interaction }) => {
    let data: ServerSettings = { trackStats: true };
    try {
      data = readJsonFile<ServerSettings>(
        `../../../data/serverSettings/${interaction.guild.id}.json`
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

    writeToJsonFile(
      `../../../data/serverSettings/${interaction.guild.id}.json`,
      data
    );
  },
});
