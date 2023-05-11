import axios from "axios";

export interface ChannelData {
  stats: { subscriberCount: number };
  title: string;
  handle?: string;
  avatar: string;
}

export async function getChannelData(channelID: string): Promise<ChannelData> {
  return new Promise(async (res, rej) => {
    let { data } = await axios
      .get(
        `https://yt.lemnoslife.com/noKey/channels?part=snippet,statistics&id=${channelID}`
      )
      .then(({ data }) => {
        return {
          data: {
            items: [
              {
                about: {
                  stats: {
                    subscriberCount: parseInt(
                      data.items[0].statistics.subscriberCount
                    ),
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
        };
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
