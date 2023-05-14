import { Event } from "../structures/Event";

export default new Event({
  name: "shardError",
  run: (_, err) => console.error(err),
});
