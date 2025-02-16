const fs = require("fs");

const source = "updateTrailStatuses.js";
const destination = "public/updateTrailStatuses.js";

fs.copyFile(source, destination, (err) => {
  if (err) {
    console.error("Error copying file:", err);
    process.exit(1);
  } else {
    console.log(`Copied ${source} to ${destination}`);
  }
});
