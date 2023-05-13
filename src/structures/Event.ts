import type { ClientEvents } from "discord.js";
import type { BotClient } from "./Client.js";

export interface EventData<K extends keyof ClientEvents> {
  name: K;
  once?: true;
  run: (client: BotClient<true>, ...args: ClientEvents[K]) => unknown;
}

export class Event<K extends keyof ClientEvents> {
  constructor(data: EventData<K>) {
    Object.assign(this, data);
  }
}
