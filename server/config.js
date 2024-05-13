const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../edge-bacnet-server-datastore.cfg");

function readConfig() {
    try {
        const configFile = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configFile);
        return config;
    } catch (error) {
        console.error(
            "Error reading config file, loading default config:",
            error
        );
        return defaultConfig();
    }
}

function writeConfig(config) {
    try {
        const configData = JSON.stringify(config, null, 2);
        fs.writeFileSync(configPath, configData);
        console.log("Configuration saved successfully.");
    } catch (err) {
        console.error("Failed to write configuration file:", err);
    }
}

function defaultConfig() {
    return {
        broadcastAddress: "192.168.1.255",
        port: 47808,
        adpuTimeout: 6000,
        objects: [
            { type: 0, instance: 3, properties: [{ id: 8 }] },
            { type: 2, instance: 1, properties: [{ id: 8 }] },
            { type: 2, instance: 3, properties: [{ id: 8 }] },
            { type: 2, instance: 4, properties: [{ id: 8 }] },
            { type: 2, instance: 5, properties: [{ id: 8 }] },
            { type: 2, instance: 6, properties: [{ id: 8 }] },
            { type: 2, instance: 7, properties: [{ id: 8 }] },
            { type: 2, instance: 8, properties: [{ id: 8 }] },
            { type: 2, instance: 21, properties: [{ id: 8 }] },
            { type: 4, instance: 1, properties: [{ id: 8 }] },
            { type: 4, instance: 2, properties: [{ id: 8 }] },
            { type: 4, instance: 3, properties: [{ id: 8 }] },
            { type: 4, instance: 4, properties: [{ id: 8 }] },
            { type: 4, instance: 5, properties: [{ id: 8 }] },
            { type: 4, instance: 6, properties: [{ id: 8 }] },
            { type: 17, instance: 1, properties: [{ id: 8 }] },
        ],
    };
}

module.exports = { readConfig, writeConfig };
