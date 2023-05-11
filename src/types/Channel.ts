export interface Guild {
  id: string;
  channel: string;
}

export interface Update {
  time: number;
  count: number;
  subsPerDay: number;
}

export interface Channel {
  name: string;
  lastCount: number;
  lastSubsPerDay: number;
  lastAPIUpdate: number;
  guilds: Guild[];
  users?: string[];
  previousUpdates: Update[];
}
