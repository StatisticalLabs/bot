import { Event } from "../structures/Event";

export default new Event({
  name: "error",
  run: (_, err) => console.error(err),
});
