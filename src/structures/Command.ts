import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { BotClient } from "../structures/Client.js";

export interface Interaction extends ChatInputCommandInteraction<"cached"> {
  member: GuildMember;
}

export interface CommandData {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  run: ({
    client,
    interaction,
  }: {
    client: BotClient<true>;
    interaction: Interaction;
  }) => unknown;
  autocomplete?: ({
    client,
    interaction,
  }: {
    client: BotClient<true>;
    interaction: AutocompleteInteraction;
  }) => unknown;
}

export class Command {
  constructor(data: CommandData) {
    Object.assign(this, data);
  }
}
