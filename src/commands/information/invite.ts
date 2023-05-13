import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/Command.js";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invite me to your server!"),
  run: ({ client, interaction }) =>
    interaction.reply({
      content: `🔗 [Invite me!](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=19456&scope=bot%20applications.commands)`,
      ephemeral: true,
    }),
});
