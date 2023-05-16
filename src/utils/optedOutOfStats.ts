import type { ServerSettings } from "../types/ServerSettings.js";
import { readJsonFile } from "./json.js";

export function optedOutOfStats(guildId: string) {
  let serverSettings: ServerSettings = { trackStats: true };

  try {
    serverSettings = readJsonFile<ServerSettings>(
      `../../../data/serverSettings/${guildId}.json`
    );
  } catch {
    // serverSettings is set to a default value
  }

  return !serverSettings.trackStats;
}
