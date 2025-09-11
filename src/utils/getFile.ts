import fs from "fs";

//TODO: bien ou enlever ?
type FileLike = {
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function getFile(path: string): FileLike {
  if (typeof Bun !== "undefined") {
    const file = Bun.file(path);
    return {
      json: () => file.json(),
      text: () => file.text(),
      arrayBuffer: () => file.arrayBuffer(),
    };
  } else {
    return {
      json: async () => JSON.parse(fs.readFileSync(path, "utf-8")),
      text: async () => fs.readFileSync(path, "utf-8"),
      arrayBuffer: async () => fs.readFileSync(path).buffer,
    };
  }
}
