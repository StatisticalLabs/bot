import { Event } from "../structures/Event.js";

export default new Event({
  name: "error",
  run: (_, err) => console.error(err),
});
