import axios from "axios";
import * as cheerio from 'cheerio';
import { handleUrl, legacyUrl } from "./regex";

type ValidatedChannel =
  | { error: false; id: string }
  | { error: true; message: string };

export async function validateChannel(
  query: string
): Promise<ValidatedChannel> {
  let id = "";
  if (!query.startsWith("UC")) {
    if (query.match(handleUrl)) {
      try {
        const { data } = await axios.get(
          `https://youtube.com/@${query.replace(handleUrl, "")}`
        );
        const $ = cheerio.load(data);
        const channelId = $("meta[itemprop=\"channelId\"]").attr("content")
        if(!channelId) return { error: true, message: "Invalid YouTube URL." };
        id = channelId;
      } catch {
        return { error: true, message: "Invalid YouTube URL." };
      }
    } else if (query.match(legacyUrl)) {
     id = query.replace(legacyUrl, "").replace(/[^0-9a-zA-Z_\-]/, "")
    } else if (query.match(/@/gm)) {
      try {
        const { data } = await axios.get(
          `https://youtube.com/${query}`
        );
        const $ = cheerio.load(data);
        const channelId = $("meta[itemprop=\"channelId\"]").attr("content")
        if(!channelId) return { error: true, message: "Invalid YouTube URL." };
        id = channelId;
      } catch {
        return { error: true, message: "Invalid YouTube URL." };
      }
    }
  } else {
    id = query.replace(/[^0-9a-zA-Z_\-]/, "");
  }

  if (!id.length)
    return { error: true, message: "Invalid YouTube URL, handle, or ID." };

  return { error: false, id };
}
