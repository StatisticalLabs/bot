import axios from "axios";

export interface ChannelData {
  stats: {
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
  };
  title: string;
  handle?: string;
  avatar: string;
}

interface NestedChannelData {
  data: { items: { about: ChannelData }[] };
}

export async function getChannelData(channelID: string): Promise<ChannelData> {
  return new Promise(async (res, rej) => {
    const { data } = await axios
      .get(
        `https://yt.lemnoslife.com/noKey/channels?part=snippet,statistics&id=${channelID}`
      )
      .then<NestedChannelData>(({ data }) => {
        return {
          data: {
            items: [
              {
                about: {
                  stats: {
                    subscriberCount: parseInt(
                      data.items[0].statistics.subscriberCount
                    ),
                    viewCount: parseInt(data.items[0].statistics.viewCount),
                    videoCount: parseInt(data.items[0].statistics.videoCount),
                  },
                  title: data.items[0].snippet.title,
                  handle: data.items[0].snippet.customUrl,
                  avatar:
                    data.items[0].snippet.thumbnails.high.url ||
                    data.items[0].snippet.thumbnails.medium.url ||
                    data.items[0].snippet.thumbnails.default.url,
                },
              },
            ],
          },
        } satisfies NestedChannelData;
      })
      .catch(() => ({
        data: null,
      }));
    // if (!data || !data.items) {
    //   const { data: mixernoData } = await axios.get(
    //     `https://mixerno.space/api/youtube-channel-counter/user/${channelID}`
    //   );
    //   if (!mixernoData || !mixernoData.counts || !mixernoData.user)
    //     return rej(`Channel information for ${channelID} not found.`);

    //   data = {
    //     items: [
    //       {
    //         about: {
    //           stats: {
    //             subscriberCount: mixernoData.counts[2].count,
    //           },
    //           title: mixernoData.user[0].count,
    //           handle: null,
    //           avatar: mixernoData.user[1].count,
    //         },
    //       },
    //     ],
    //   };
    // }
    if (!data || !data.items)
      return rej(`Channel information for ${channelID} not found.`);

    return res({ ...data.items[0].about });
  });
}
