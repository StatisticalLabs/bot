import type { ServerSettings } from "../types/ServerSettings";
import { readJsonFile } from "./json";

export function optedOutOfStats(guildId: string) {
  let serverSettings: ServerSettings = { trackStats: true };

  try {
    serverSettings = readJsonFile<ServerSettings>(
      `../../../data/serverSettings/${guildId}`
    );
  } catch {
    // serverSettings is set to a default value
  }

  return serverSettings.trackStats;
}
