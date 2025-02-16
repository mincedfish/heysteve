import fs from "fs";
import path from "path";

// Define the absolute root directory
const rootDir = path.resolve(process.cwd()); // Resolves to the absolute root directory
const distDir = path.join(rootDir, "dist");

// Define absolute paths for files in the root directory
const trailsFile = path.join(rootDir, "trails.js"); // Reference root/trails.js
const distTrailsFile = path.join(distDir, "trails.js");

const updateScriptFile = path.join(rootDir, "updateTrailStatuses.js"); // Reference root/updateTrailStatuses.js
const distUpdateScriptFile = path.join(distDir, "updateTrailStatuses.js");

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy trails.js from root directory to dist/
if (fs.existsSync(trailsFile)) {
    fs.copyFileSync(trailsFile, distTrailsFile);
    console.log("✅ trails.js copied from root to dist/");
} else {
    console.error("❌ trails.js not found in root directory. Make sure it exists.");
}

// Copy updateTrailStatuses.js from root directory to dist/
if (fs.existsSync(updateScriptFile)) {
    fs.copyFileSync(updateScriptFile, distUpdateScriptFile);
    console.log("✅ updateTrailStatuses.js copied from root to dist/");
} else {
    console.error("❌ updateTrailStatuses.js not found in root directory. Make sure it exists.");
}
