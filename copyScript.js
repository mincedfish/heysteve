import fs from "fs";
import path from "path";

// Define paths
const publicDir = path.join(process.cwd(), "public");
const distDir = path.join(process.cwd(), "dist");
const trailsFile = path.join(publicDir, "trails.js");
const distTrailsFile = path.join(distDir, "trails.js");
const updateScriptFile = path.join(process.cwd(), "updateTrailStatuses.js");
const distUpdateScriptFile = path.join(distDir, "updateTrailStatuses.js");

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy trails.js to dist/
if (fs.existsSync(trailsFile)) {
    fs.copyFileSync(trailsFile, distTrailsFile);
    console.log("✅ trails.js copied to dist/");
} else {
    console.error("❌ trails.js not found in public/. Make sure it exists.");
}

// Copy updateTrailStatuses.js from root directory to dist/
if (fs.existsSync(updateScriptFile)) {
    fs.copyFileSync(updateScriptFile, distUpdateScriptFile);
    console.log("✅ updateTrailStatuses.js copied from root to dist/");
} else {
    console.error("❌ updateTrailStatuses.js not found in the root directory. Make sure it exists.");
}
