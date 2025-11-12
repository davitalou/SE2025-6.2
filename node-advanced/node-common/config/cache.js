import fs from "fs";
import path from "path";

export const cache = {
  type: "file",
  dir: path.resolve("cache"),
  get: (key) => {
    const file = path.join(cache.dir, key + ".json");
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  },
  set: (key, value) => {
    if (!fs.existsSync(cache.dir)) fs.mkdirSync(cache.dir);
    fs.writeFileSync(
      path.join(cache.dir, key + ".json"),
      JSON.stringify(value, null, 2)
    );
  },
};
