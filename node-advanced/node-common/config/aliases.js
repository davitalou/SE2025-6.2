import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const aliases = {
  "@common": path.resolve(__dirname, "../"),
  "@frontend": path.resolve(__dirname, "../../node-frontend"),
  "@backend": path.resolve(__dirname, "../../node-backend"),
  "@console": path.resolve(__dirname, "../../node-console"),
};
