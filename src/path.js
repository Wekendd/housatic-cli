const fs = require("fs");
const os = require("os");
const path = require("path");

let platformPath; // okay i made every relavent path thing use this
if (process.platform == "win32") {
    platformPath = path.join(process.env.APPDATA, "housatic"); // %APPDATA%\housatic
} else if (process.platform == "linux") {
    platformPath = path.join(os.homedir(), "housatic"); // ~/housatic
} else if (process.platform == "darwin") {
    platformPath = path.join(process.env.HOME, "Library", "Application Support", "housatic"); // ~/Library/Application Support/housatic
} else {
    platformPath = "."; // Unknown OS, all data will go in the same directory
}

if (!fs.existsSync(platformPath)) {
    fs.mkdirSync(platformPath);
    fs.mkdirSync(platformPath + "/bots/");
}

module.exports = platformPath;