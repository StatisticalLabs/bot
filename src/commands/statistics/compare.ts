import axios from "axios";
import type { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import { Command } from "../../structures/Command.js";
import type { Channel } from "../../types/Channel.js";
import { abbreviate } from "../../utils/abbreviate.js";
import { readJsonFile } from "../../utils/json.js";
import { handleUrl, legacyUrl } from "../../utils/regex.js";

const width = 400; //px
const height = 400; //px
const backgroundColour = "transparent";
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour,
});
const colors = ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(75, 192, 192)"];

export default new Command({
  data: new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Compare two (or three) YouTube channels.")
    .addStringOption((option) =>
      option
        .setName("channel1")
        .setDescription("The first channel to compare.")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("channel2")
        .setDescription("The second channel to compare.")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("channel3")
        .setDescription("The third channel to compare.")
        .setRequired(false)
        .setAutocomplete(true)
    ),
  autocomplete: async ({ interaction }) => {
    const focusedValue = interaction.options.getFocused();
    console.log(focusedValue);
    const choices = fs
      .readdirSync("./data/channels")
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const channel = readJsonFile<Channel>(
          `../../../../data/channels/${file}`
        );
        return {
          name: channel.name,
          mainCount: channel.lastCount,
          id: file.split(".json")[0],
        };
      });
    const filtered = choices
      .filter((choice) => {
        return (choice.name || "")
          .toLowerCase()
          .includes(focusedValue.toLowerCase());
      })
      .slice(0, 25);
    await interaction.respond(
      filtered.map((channel) => ({
        name: `${channel.name} • ${abbreviate(
          channel.mainCount
        )} subscribers`.slice(0, 100),
        value: channel.id,
      }))
    );
  },
  /**
   * @param {{ client: import('discord.js').Client, interaction: import('discord.js').ChatInputCommandInteraction }} options
   */
  run: async ({ interaction }) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const channels = [
      interaction.options.getString("channel1", true),
      interaction.options.getString("channel2", true),
      interaction.options.getString("channel3"),
    ];
    const ids: string[] = [];
    // TODO: move this to validateChannel()
    channels.filter(Boolean).forEach(async (query) => {
      if (!query.startsWith("UC")) {
        if (query.match(handleUrl)) {
          try {
            const { data } = await axios.get(
              `https://www.banner.yt/@${query.replace(handleUrl, "")}`
            );
            ids.push(data.channelId);
          } catch {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("Invalid YouTube URL.")
                  .setColor("Red"),
              ],
              ephemeral: true,
            });
          }
        } else if (query.match(legacyUrl)) {
          try {
            const { data } = await axios.get(
              `https://www.banner.yt/channel/${query.replace(legacyUrl, "")}`
            );
            ids.push(data.channelId);
          } catch {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("Invalid YouTube URL.")
                  .setColor("Red"),
              ],
              ephemeral: true,
            });
          }
        } else if (query.match(/@/gm)) {
          try {
            const { data } = await axios.get(`https://www.banner.yt/${query}`);
            ids.push(data.channelId);
          } catch {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("Invalid YouTube handle.")
                  .setColor("Red"),
              ],
              ephemeral: true,
            });
          }
        }
      } else {
        ids.push(query.replace(/[^0-9a-zA-Z_-]/, ""));
      }
    });

    if (!ids.length)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Invalid YouTube URL, handle, or ID.")
            .setColor("Red"),
        ],
        ephemeral: true,
      });

    const data = ids.map((channelID) => {
      const channel = readJsonFile<Channel>(
        `../../../../data/channels/${channelID}.json`
      );

      return channel;
    });

    const configuration = {
      type: "line",
      data: {
        labels: data[0].previousUpdates.map((update) =>
          new Date(update.time)
            .toLocaleString("en-CA", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: false,
              timeZone: "UTC",
            })
            .split(", ")
            .join(" ")
        ),
        datasets: data.map((channel, index) => ({
          label: channel.name,
          data: (
            channel.previousUpdates || [
              {
                time: channel.lastAPIUpdate,
                count: channel.lastCount,
              },
            ]
          ).map((update) => update.count),
          backgroundColor: colors[index],
          borderColor: colors[index],
          tension: 0.1,
        })),
      },
      options: {
        scales: {
          x: {
            grid: {
              color: "transparent",
              borderColor: "transparent",
            },
          },
          y: {
            grid: {
              color: "transparent",
              borderColor: "transparent",
            },
          },
        },
      },
    } satisfies ChartConfiguration;

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: `${ids.join("-vs-")}.png`,
    });

    interaction.followUp({
      files: [attachment],
    });
  },
});
