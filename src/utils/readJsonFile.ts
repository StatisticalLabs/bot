import { readFileSync } from "fs";

export function readJsonFile<T = unknown>(path: string): T {
  const file = readFileSync(path.replace(/(?:\.\.\/)+/g, "./"), "utf8");
  return JSON.parse(file) as T;
}