import type { ChartConfiguration, ChartData } from "chart.js";

export function graphConfiguration(data: ChartData): ChartConfiguration {
  return {
    type: "line",
    data,
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            displayFormats: {
              day: "YYYY-MM-DD HH:mm",
            },
          },
          grid: {
            color: "transparent",
            borderColor: "transparent",
          },
        },
        y: {
          grid: {
            color: "transparent",
            borderColor: "transparent",
          },
        },
      },
    },
  };
}
