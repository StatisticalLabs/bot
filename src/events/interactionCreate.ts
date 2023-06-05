import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { GuildMember } from "discord.js";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} from "discord.js";
import fs from "fs";
import type { Interaction } from "../structures/Command.js";
import { Event } from "../structures/Event.js";
import type { Channel } from "../types/Channel.js";
import { abbreviate } from "../utils/abbreviate.js";
import { getChannelData } from "../utils/getChannelData.js";
import { graphConfiguration } from "../utils/graphConfiguration.js";
import { readJsonFile, writeToJsonFile } from "../utils/json.js";

const width = 400; //px
const height = 400; //px
const backgroundColour = "transparent";
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour,
  plugins: {
    modern: ["chartjs-adapter-moment"],
  },
});

export default new Event({
  name: "interactionCreate",
  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').Interaction} interaction
   */
  run: async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
      if (!interaction.inGuild())
        return interaction.reply({
          content: "My commands only work in servers.",
          ephemeral: true,
        });

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.run({ client, interaction: interaction as Interaction });
      } catch (err) {
        console.error(err);
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;

      try {
        await command.autocomplete({ client, interaction });
      } catch (err) {
        console.error(err);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith("unwatch-")) {
        await interaction.deferReply({
          ephemeral: true,
        });

        if (!(interaction.member as GuildMember).permissions.has("ManageGuild"))
          return interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  "You don't have permission to unwatch channels."
                )
                .setColor("Red"),
            ],
          });

        const id = interaction.customId.split("unwatch-")[1];

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
          const data = readJsonFile<Channel>(`../../data/channels/${id}.json`);
          if (!data.guilds.find((x) => x.id === interaction.guild!.id))
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    "That channel has not been watched on this server."
                  )
                  .setColor("Red"),
              ],
            });
          const filteredGuilds = data.guilds.filter(
            (x) => x.id !== interaction.guild!.id
          );
          data.guilds = filteredGuilds;
          writeToJsonFile(`./data/channels/${id}.json`, data);
        }

        interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${data.title} ${data.handle ? `(${data.handle})` : ""}`,
                iconURL: `https://www.banner.yt/${id}/avatar`,
              })
              .setDescription("Stopped tracking.")
              .setColor("White"),
          ],
        });

        interaction.channel!.send({
          content: `📉 **${interaction.user.tag}** stopped tracking **${
            data.title
          }**${data.handle ? ` (${data.handle})` : ""}.`,
        });
      } else if (interaction.customId.startsWith("info-")) {
        await interaction.deferReply({
          ephemeral: true,
        });

        const [channelID, ...info] = interaction.customId
          .split("info-")[1]
          .split(":");

        const diffTime = parseFloat(info[0]);
        const currentCount = parseFloat(info[1]);
        const lastCount = parseFloat(info[2]);

        const getSubsPer = (time: number) =>
          ((currentCount - lastCount) / (diffTime / 1000)) * time;

        const subsPerSecond = getSubsPer(1);
        const subsPerMinute = getSubsPer(60);
        const subsPerHour = getSubsPer(60 * 60);
        const subsPerDay = getSubsPer(60 * 60 * 24);
        const subsPerWeek = getSubsPer(60 * 60 * 24 * 7);
        const subsPerMonth = getSubsPer(60 * 60 * 24 * 30);
        const subsPerYear = getSubsPer(60 * 60 * 24 * 365);

        const data = await getChannelData(channelID);

        const allChannels = fs
          .readdirSync("./data/channels")
          .filter((file) => file.endsWith(".json"))
          .filter((x) => x.split(".json")[0] !== channelID)
          .map((file) => readJsonFile<Channel>(`../../data/channels/${file}`));

        const channelsWithSameCount = allChannels.filter(
          (channel) => channel.lastCount === currentCount
        );
        const channelsPassed = allChannels.filter(
          (channel) => channel.lastCount === lastCount
        );

        interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${data.title}${data.handle ? ` (${data.handle})` : ""}`,
                iconURL: `https://www.banner.yt/${channelID}/avatar`,
              })
              .setDescription(
                [
                  `**Subscribers/second**: ${abbreviate(subsPerSecond)}`,
                  `**Subscribers/minute**: ${abbreviate(subsPerMinute)}`,
                  `**Subscribers/hour**: ${abbreviate(subsPerHour)}`,
                  `**Subscribers/day**: ${abbreviate(subsPerDay)}`,
                  `**Subscribers/week**: ${abbreviate(subsPerWeek)}`,
                  `**Subscribers/30 days**: ${abbreviate(subsPerMonth)}`,
                  `**Subscribers/year**: ${abbreviate(subsPerYear)}`,
                  channelsWithSameCount.length
                    ? `**Channels with the same API count** (${
                      channelsWithSameCount.length
                    }): ${channelsWithSameCount
                      .map((channel) => channel.name)
                      .join(", ")}`
                    : null,
                  channelsPassed.length
                    ? `**Channels passed** (${
                      channelsPassed.length
                    }): ${channelsPassed
                      .map((channel) => channel.name)
                      .join(", ")}`
                    : null,
                ]
                  .filter(Boolean)
                  .join("\n")
              )
              .setColor("White")
              .setFooter({
                text: "Keep in mind that these are just averages based on the current growth.",
              }),
          ],
        });
      } else if (interaction.customId.startsWith("graph-")) {
        await interaction.deferReply({
          ephemeral: true,
        });

        const channelID = interaction.customId.split("graph-")[1];

        const msg = await interaction.followUp({
          content: "Select a graph type:",
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`allsubgraph-${channelID}`)
                .setLabel("Subscriber graph")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`subsdaygraph-${channelID}`)
                .setLabel("Subscribers/day graph")
                .setStyle(ButtonStyle.Success)
            ),
          ],
          ephemeral: true,
          fetchReply: true,
        });

        const collector = msg.createMessageComponentCollector({
          componentType: ComponentType.Button,
        });

        collector.on("collect", async (i) => {
          await i.deferReply({
            ephemeral: true,
          });

          if (i.customId.startsWith("allsubgraph-")) {
            const channelID = i.customId.split("allsubgraph-")[1];
            const data = readJsonFile<Channel>(
              `../../data/channels/${channelID}.json`
            );

            const configuration = graphConfiguration({
              labels: data.previousUpdates.map(
                (update) => new Date(update.time)
              ),
              datasets: [
                {
                  label: data.name,
                  data: data.previousUpdates.map((update) => update.count),
                  backgroundColor: "rgb(255, 99, 132)",
                  borderColor: "rgb(255, 99, 132)",
                  tension: 0.1,
                  pointRadius: 2.4,
                },
              ],
            });

            const imageBuffer = await chartJSNodeCanvas.renderToBuffer(
              configuration
            );
            const attachment = new AttachmentBuilder(imageBuffer, {
              name: `${channelID}.png`,
            });

            i.followUp({
              content: undefined,
              components: [],
              files: [attachment],
            });
          } else if (i.customId.startsWith("subsdaygraph-")) {
            const channelID = i.customId.split("subsdaygraph-")[1];
            const data = readJsonFile<Channel>(
              `../../data/channels/${channelID}.json`
            );

            const configuration = graphConfiguration({
              labels: data.previousUpdates
                .filter((update) => update.subsPerDay)
                .map((update) => new Date(update.time)),
              datasets: [
                {
                  label: data.name,
                  data: data.previousUpdates
                    .map((update) => update.subsPerDay || null)
                    .filter((x) => x),
                  backgroundColor: "rgb(255, 99, 132)",
                  borderColor: "rgb(255, 99, 132)",
                  tension: 0.1,
                  pointRadius: 2.4,
                },
              ],
            });

            const imageBuffer = await chartJSNodeCanvas.renderToBuffer(
              configuration
            );
            const attachment = new AttachmentBuilder(imageBuffer, {
              name: `${channelID}.png`,
            });

            i.followUp({
              content: undefined,
              components: [],
              files: [attachment],
            });
          }
        });
      }
    }
  },
});
