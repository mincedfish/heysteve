import { copyFile } from "fs/promises";

const source = "updateTrailStatuses.js";
const destination = "public/updateTrailStatuses.js";

try {
  await copyFile(source, destination);
  console.log(`Copied ${source} to ${destination}`);
} catch (err) {
  console.error("Error copying file:", err);
  process.exit(1);
}
