import { Event } from "../structures/Event.js";

export default new Event({
  name: "shardError",
  run: (_, err) => console.error(err),
});
