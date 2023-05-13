import { readFileSync, writeFileSync } from "fs";

export function readJsonFile<T extends object = object>(path: string): T {
  const file = readFileSync(path.replace(/(?:\.\.\/)+/g, "./"), "utf8");
  return JSON.parse(file) as T;
}

export function writeToJsonFile<T extends object = object>(
  path: string,
  object: T
) {
  writeFileSync(
    path.replace(/(?:\.\.\/)+/g, "./"),
    JSON.stringify(object, null, 2)
  );
}
