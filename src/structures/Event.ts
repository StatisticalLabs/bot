import { ClientEvents } from "discord.js";
import { BotClient } from "./Client";

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
