import { Event } from "../structures/Event";

export default new Event({
  name: "shardReady",
  run: (_, id) => console.log(`Launched shard #${id}.`),
});
