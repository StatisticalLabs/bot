import cors from "cors";
import express from "express";
import { BotClient } from "./structures/Client";
import { Channel } from "./types/Channel";

const app = express().use(cors());

export default (_client: BotClient) => {
  app.get("/stats/:id", (req, res) => {
    const { id } = req.params;
    let data: Channel | null = null;
    try {
      data = require(`./data/channels/${id}.json`) as Channel;
    } catch {}
    if (!data)
      return res.status(404).json({
        status: 404,
        error: "Channel not found.",
      });
    res.json({
      name: data.name,
      previousUpdates: data.previousUpdates.filter(
        (update) => update.time && update.count && update.subsPerDay
      ),
    });
  });

  app.listen(10101, () => console.log("Listening for requests on port 10101."));
};
