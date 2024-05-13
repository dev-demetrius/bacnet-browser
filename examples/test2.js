const express = require("express");
const bodyParser = require("body-parser");
const Bacnet = require("node-bacnet");
const fs = require("fs");
const path = require("path");
const app = express();
const devices = [];
const MAX_CONCURRENT_NETWORKS = 5; // Limit the number of concurrent network scans

app.use(bodyParser.json());
app.use(express.static("public"));

const OBJECT_DEVICE = 8;
const PROP_OBJECT_NAME = 77;
const MAX_MAC_ADDRESS = 20; // Highest possible MAC address for MSTP
const configPath = path.join(__dirname, "edge-bacnet-server-datastore.cfg");

let clientOptions = readConfig();
let client = new Bacnet(clientOptions);

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
        console.error("Error reading config file:", error);
        return {
            broadcastAddress: "192.168.1.255",
            port: 47808,
            startNetwork: 0,
            endNetwork: 1000,
            adpuTimeout: 6000,
        };
    }
}

function initializeClient(options) {
    if (client) client.close();
    client = new Bacnet(options);
    setupIAmListener();
}

function setupIAmListener() {
    client.removeAllListeners("iAm"); // Remove existing listeners to prevent memory leak
    client.on("iAm", (device) => {
        console.log("Device found:", device);
        const deviceId = device.payload.deviceId;
        const networkNumber =
            device.payload.network || clientOptions.startNetwork; // Use clientOptions to get startNetwork

        if (!devices.some((d) => d.deviceId === deviceId)) {
            devices.push({
                deviceId: deviceId,
                address: device.header.sender.address,
                network: networkNumber,
                maxApdu: device.payload.maxApdu,
                name: "Name not yet retrieved", // Placeholder
                segmentation: device.payload.segmentation,
                vendorId: device.payload.vendorId,
            });
            console.log(
                `Device ${deviceId} added from network ${networkNumber}`
            );
            readObjectNameForAllMacs(
                device.header.sender.address,
                networkNumber,
                deviceId
            );
        }
    });
}

async function readObjectNameForAllMacs(address, network, deviceId) {
    for (let mac = 0; mac <= MAX_MAC_ADDRESS; mac++) {
        try {
            const value = await new Promise((resolve, reject) => {
                client.readProperty(
                    { address, net: network, adr: [mac] },
                    { type: OBJECT_DEVICE, instance: deviceId },
                    PROP_OBJECT_NAME,
                    (err, value) => {
                        if (err) {
                            console.error(`Error on read for MAC ${mac}:`, err);
                            reject(err);
                        } else {
                            resolve(value);
                        }
                    }
                );
            });

            if (value && value.values[0].value) {
                console.log(
                    `Device ID: ${deviceId}, MAC: ${mac}, Name: ${value.values[0].value}`
                );
                let deviceIndex = devices.findIndex(
                    (d) => d.deviceId === deviceId
                );
                if (deviceIndex !== -1) {
                    devices[deviceIndex].name = value.values[0].value;
                    devices[deviceIndex].mac = mac; // Storing successful MAC address
                    break; // Stop the loop if successful read
                }
            }
        } catch (err) {
            console.log(
                `Read failed for MAC ${mac} on Device ID ${deviceId}, continuing...`
            );
        }
    }
}

async function discoverDevices(startNetwork, endNetwork) {
    let currentNetwork = startNetwork;
    while (currentNetwork <= endNetwork) {
        let promises = [];
        for (
            let i = 0;
            i < MAX_CONCURRENT_NETWORKS && currentNetwork <= endNetwork;
            i++, currentNetwork++
        ) {
            console.log(`Sending WhoIs request on network ${currentNetwork}`);
            promises.push(
                new Promise((resolve) => {
                    client.whoIs({ net: currentNetwork });
                    setTimeout(resolve, 1000); // Wait for 1 second to allow time for responses
                })
            );
        }
        await Promise.all(promises);
    }
}

app.get("/devices", (req, res) => {
    res.json(devices);
});

app.post("/config", (req, res) => {
    const { broadcastAddress, port, startNetwork, endNetwork, adpuTimeout } =
        req.body;
    Object.assign(clientOptions, {
        broadcastAddress,
        port,
        startNetwork,
        endNetwork,
        adpuTimeout,
    });

    fs.writeFile(configPath, JSON.stringify(clientOptions, null, 2), (err) => {
        if (err) {
            console.error("Failed to write configuration file:", err);
            return res.status(500).send("Failed to update configuration.");
        }

        initializeClient(clientOptions);
        discoverDevices(
            clientOptions.startNetwork,
            clientOptions.endNetwork
        ).then(() => {
            console.log("Device discovery complete.");
        });
        res.send("Configuration updated and device discovery initiated.");
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
