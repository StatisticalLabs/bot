import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import { Command } from "../../structures/Command.js";
import type { Messages, Reactions } from "../../types/User.js";
import { readJsonFile } from "../../utils/json.js";

function sort(a: number, b: number) {
  return b > a ? 1 : b === a ? 0 : -1;
}

export default new Command({
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View leaderboards.")
    .addSubcommandGroup((group) =>
      group
        .setName("global")
        .setDescription("View global leaderboards.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("messages")
            .setDescription("View the global messages leaderboard.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("characters")
            .setDescription("View the global characters leaderboard.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reactions")
            .setDescription("View the global reactions leaderboard.")
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("server")
        .setDescription("View server leaderboards.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("messages")
            .setDescription("View the server messages leaderboard.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("characters")
            .setDescription("View the server characters leaderboard.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reactions")
            .setDescription("View the server reactions leaderboard.")
        )
    ),
  /**
   * @param {{ client: import('discord.js').Client, interaction: import('discord.js').ChatInputCommandInteraction }} options
   */
  run: async ({ client, interaction }) => {
    await interaction.deferReply();
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    switch (group) {
    case "global":
      {
        const allMessageUsers = fs
          .readdirSync("./data/messages")
          .filter((file) => file.endsWith(".json"))
          .map((user) => ({
            userID: user.split(".json")[0].split("-")[0],
            ...readJsonFile<any>(`../../../../data/messages/${user}`),
          }));
        const allReactionUsers = fs
          .readdirSync("./data/reactions")
          .filter((file) => file.endsWith(".json"))
          .map((user) => ({
            userID: user.split(".json")[0].split("-")[0],
            ...readJsonFile<any>(`../../../data/reactions/${user}`),
          }));

        const users: ({ userID: string } & Messages & Reactions)[] = [];
        allMessageUsers.forEach((user) => {
          if (users.find((x) => x.userID === user.userID)) {
            const index = users.findIndex((x) => x.userID === user.userID);
            users[index] = {
              ...users[index],
              messages: (users[index].messages || 0) + (user.messages || 0),
              characters:
                  (users[index].characters || 0) + (user.characters || 0),
            };
          } else users.push(user);
        });
        allReactionUsers.forEach((user) => {
          if (users.find((x) => x.userID === user.userID)) {
            const index = users.findIndex((x) => x.userID === user.userID);
            users[index] = {
              ...users[index],
              reactions: user.reactions || 0,
            };
          } else
            users.push({
              ...user,
              messages: undefined,
              characters: undefined,
            });
        });

        switch (subcommand) {
        case "messages":
          {
            const sorted = users
              .filter((x) => x?.messages)
              .sort((a, b) => sort(a.messages, b.messages))
              .splice(0, 10);

            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: "Global Messages Leaderboard",
                    iconURL: client.user.displayAvatarURL(),
                  })
                  .setDescription(
                    (
                      await Promise.all(
                        sorted.map(async (user) => ({
                          username: await client.users
                            .fetch(user.userID)
                            .then((user) => user.username),
                          ...user,
                        }))
                      )
                    )
                      .map(
                        (user, index) =>
                          `${index + 1}. **${
                            user?.username
                          }**: ${user?.messages?.toLocaleString()}`
                      )
                      .join("\n")
                  )
                  .setColor("White")
                  .setFooter({
                    text: `Total: ${users
                      .map((user) => user?.messages || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                  }),
              ],
            });
          }
          break;
        case "characters":
          {
            const sorted = users
              .filter((x) => x?.characters)
              .sort((a, b) => sort(a.characters, b.characters))
              .splice(0, 10);

            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: "Global Characters Leaderboard",
                    iconURL: client.user.displayAvatarURL(),
                  })
                  .setDescription(
                    (
                      await Promise.all(
                        sorted.map(async (user) => ({
                          username: await client.users
                            .fetch(user.userID)
                            .then((user) => user.username),
                          ...user,
                        }))
                      )
                    )
                      .map(
                        (user, index) =>
                          `${index + 1}. **${
                            user?.username
                          }**: ${user?.characters?.toLocaleString()}`
                      )
                      .join("\n")
                  )
                  .setColor("White")
                  .setFooter({
                    text: `Total: ${users
                      .map((user) => user?.characters || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                  }),
              ],
            });
          }
          break;
        case "reactions":
          {
            const sorted = users
              .filter((x) => x?.reactions)
              .sort((a, b) => sort(a.reactions, b.reactions))
              .splice(0, 10);

            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: "Global Reactions Leaderboard",
                    iconURL: client.user.displayAvatarURL(),
                  })
                  .setDescription(
                    (
                      await Promise.all(
                        sorted.map(async (user) => ({
                          username: await client.users
                            .fetch(user.userID)
                            .then((user) => user.username),
                          ...user,
                        }))
                      )
                    )
                      .map(
                        (user, index) =>
                          `${index + 1}. **${
                            user?.username
                          }**: ${user?.reactions?.toLocaleString()}`
                      )
                      .join("\n")
                  )
                  .setColor("White")
                  .setFooter({
                    text: `Total: ${users
                      .map((user) => user?.reactions || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                  }),
              ],
            });
          }
          break;
        }
      }
      break;
    case "server":
      {
        const allMessageUsers = fs
          .readdirSync("./data/messages")
          .filter((file) => file.endsWith(".json"))
          .filter((file) =>
            file.split(".json")[0].endsWith(interaction.guild.id)
          )
          .map((user) => ({
            userID: user.split(".json")[0].split("-")[0],
            ...readJsonFile<any>(`../../../data/messages/${user}`),
          }));
        const allReactionUsers = fs
          .readdirSync("./data/reactions").filter((file) => file.endsWith(".json"))
          .filter((file) =>
            file.split(".json")[0].endsWith(interaction.guild.id)
          )
          .map((user) => ({
            userID: user.split(".json")[0].split("-")[0],
            ...readJsonFile<any>(`../../../data/reactions/${user}`),
          }));

        const users = [...allMessageUsers];
        allReactionUsers.forEach((user) => {
          if (users.find((x) => x.userID === user.userID)) {
            const index = users.findIndex((x) => x.userID === user.userID);
            users[index] = {
              ...users[index],
              reactions: user.reactions || 0,
            };
          } else
            users.push({
              ...user,
              messages: undefined,
              characters: undefined,
            });
        });

        switch (subcommand) {
        case "messages":
          {
            const sorted = users
              .filter((x) => x?.messages)
              .sort((a, b) => sort(a.messages, b.messages))
              .splice(0, 10);

            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: `${interaction.guild.name} Messages Leaderboard`,
                    iconURL: interaction.guild.iconURL() ?? undefined,
                  })
                  .setDescription(
                    (
                      await Promise.all(
                        sorted.map(async (user) => ({
                          username: await client.users
                            .fetch(user.userID)
                            .then((user) => user.username),
                          ...user,
                        }))
                      )
                    )
                      .map(
                        (user, index) =>
                          `${index + 1}. **${
                            user?.username
                          }**: ${user?.messages?.toLocaleString()}`
                      )
                      .join("\n")
                  )
                  .setColor("White")
                  .setFooter({
                    text: `Total: ${users
                      .map((user) => user?.messages || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                  }),
              ],
            });
          }
          break;
        case "characters":
          {
            const sorted = users
              .filter((x) => x?.characters)
              .sort((a, b) => sort(a.characters, b.characters))
              .splice(0, 10);

            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: `${interaction.guild.name} Characters Leaderboard`,
                    iconURL: interaction.guild.iconURL() ?? undefined,
                  })
                  .setDescription(
                    (
                      await Promise.all(
                        sorted.map(async (user) => ({
                          username: await client.users
                            .fetch(user.userID)
                            .then((user) => user.username),
                          ...user,
                        }))
                      )
                    )
                      .map(
                        (user, index) =>
                          `${index + 1}. **${
                            user?.username
                          }**: ${user?.characters?.toLocaleString()}`
                      )
                      .join("\n")
                  )
                  .setColor("White")
                  .setFooter({
                    text: `Total: ${users
                      .map((user) => user?.characters || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                  }),
              ],
            });
          }
          break;
        case "reactions":
          {
            const sorted = users
              .filter((x) => x?.reactions)
              .sort((a, b) => sort(a.reactions, b.reactions))
              .splice(0, 10);

            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: `${interaction.guild.name} Reactions Leaderboard`,
                    iconURL: interaction.guild.iconURL() ?? undefined,
                  })
                  .setDescription(
                    (
                      await Promise.all(
                        sorted.map(async (user) => ({
                          username: await client.users
                            .fetch(user.userID)
                            .then((user) => user.username),
                          ...user,
                        }))
                      )
                    )
                      .map(
                        (user, index) =>
                          `${index + 1}. **${
                            user?.username
                          }**: ${user?.reactions?.toLocaleString()}`
                      )
                      .join("\n")
                  )
                  .setColor("White")
                  .setFooter({
                    text: `Total: ${users
                      .map((user) => user?.reactions || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                  }),
              ],
            });
          }
          break;
        }
      }
      break;
    }
  },
});
