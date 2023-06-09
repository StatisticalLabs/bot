import cors from "cors";
import express from "express";
import type { BotClient } from "./structures/Client.js";
import type { Channel } from "./types/Channel.js";
import { readJsonFile } from "./utils/json.js";

const app = express().use(cors());

export default (_client: BotClient) => {
  app.get("/stats/:id", (req, res) => {
    const { id } = req.params;
    let data: Channel | null = null;
    try {
      data = readJsonFile<Channel>(`./data/channels/${id}.json`);
    } catch {
      // data is null
    }
    if (!data)
      return res.status(404).json({
        status: 404,
        error: "Channel not found.",
      });
    res.json({
      name: data.name,
      lastCount: data.lastCount,
      previousUpdates: data.previousUpdates.filter(
        (update) => update.time && update.count && update.subsPerDay
      ),
    });
  });

  app.listen(10101, () => console.log("Listening for requests on port 10101."));
};
