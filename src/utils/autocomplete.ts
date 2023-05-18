import axios, { type AxiosResponse } from "axios";
import type { AutocompleteInteraction } from "discord.js";
import { abbreviate } from "./abbreviate.js";

export async function channelAutocomplete(
  interaction: AutocompleteInteraction
) {
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
}
