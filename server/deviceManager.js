const Bacnet = require("node-bacnet");
const { readConfig, writeConfig } = require("./config");

class DeviceDiscovery {
    constructor() {
        this.clientOptions = readConfig();
        this.client = new Bacnet(this.clientOptions);
        this.devices = []; // Store discovered devices here
        this.currentNetwork = 0;
    }

    async updateConfig(options) {
        try {
            writeConfig({ ...this.clientOptions, ...options });
            this.clientOptions = readConfig();
        } catch (error) {
            console.error("Failed to update config:", error);
            throw new Error("Failed to update configuration.");
        }
    }

    setupIAmListener() {
        this.client.removeAllListeners("iAm");
        this.client.on("iAm", (device) => {
            this.handleIAm(device, this.currentNetwork);
        });
    }

    async discoverDevices(startNetwork, endNetwork, startMac, endMac) {
        this.setupIAmListener();
        console.log("Starting device discovery...");
        for (let network = startNetwork; network <= endNetwork; network++) {
            this.currentNetwork = network;
            console.log(`Sending Who-Is request on network ${network}`);
            this.client.whoIs({ net: network });
            await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced delay
        }
        console.log(
            "Completed sending Who-Is requests, now reading object names..."
        );
        await this.readObjectNames(startMac, endMac);
    }

    handleIAm(device, networkNumber) {
        console.log(`Device found:`, device, `on network ${networkNumber}`);
        const deviceId = device.payload.deviceId;
        if (!this.devices.some((d) => d.deviceId === deviceId)) {
            this.devices.push({
                deviceId: deviceId,
                mac: device.mac,
                address: device.header.sender.address,
                network: networkNumber,
                maxApdu: device.payload.maxApdu,
                name: "Name not yet retrieved",
                segmentation: device.payload.segmentation,
                vendorId: device.payload.vendorId,
            });
            console.log(
                `Device ${deviceId} added from network ${networkNumber}`
            );
        }
    }

    async readObjectNames(startMac, endMac) {
        const promises = this.devices.map((device) =>
            this.attemptReadNames(device, startMac, endMac)
        );
        await Promise.all(promises);
    }

    async readObjectName(device, mac) {
        console.log(
            `Attempting to read from Device ID: ${device.deviceId}, MAC: ${mac}`
        );
        return new Promise((resolve, reject) => {
            this.client.readProperty(
                { address: device.address, net: device.network, adr: [mac] },
                { type: 8, instance: device.deviceId },
                77, // Assuming you are reading the 'object-name' property
                (err, value) => {
                    if (err) {
                        console.error(
                            `Error reading from Device ID: ${device.deviceId}, MAC: ${mac}:`,
                            err
                        );
                        reject(err);
                    } else if (value && value.values && value.values[0].value) {
                        console.log(
                            `Read successful from Device ID: ${device.deviceId}, MAC: ${mac}: ${value.values[0].value}`
                        );
                        resolve(value.values[0].value);
                    } else {
                        console.error(
                            `No value received from Device ID: ${device.deviceId}, MAC: ${mac}`
                        );
                        reject(new Error("No value received"));
                    }
                }
            );
        });
    }

    async attemptReadNames(device, startMac, endMac) {
        console.log(device, startMac, endMac);
        for (let mac = startMac; mac <= endMac; mac++) {
            console.log(`Attempting to read name at MAC ${mac}`);
            try {
                let name = await this.readObjectName(device, mac);
                console.log(`Device ID: ${device}, MAC: ${mac}, Name: ${name}`);
                this.updateDeviceName(device.deviceId, mac, name);
                break;
            } catch (error) {
                console.log(`Failed at MAC ${mac}:`);
            }
        }
    }

    updateDeviceName(deviceId, mac, name) {
        let deviceIndex = this.devices.findIndex(
            (d) => d.deviceId === deviceId
        );
        if (deviceIndex !== -1) {
            this.devices[deviceIndex].name = name;
            this.devices[deviceIndex].mac = mac;
            console.log(`Device ID: ${deviceId}, MAC: ${mac}, Name: ${name}`);
        }
    }

    initializeClient() {
        this.clientOptions = readConfig();
        if (this.client) this.client.close();
        this.client = new Bacnet(this.clientOptions);
        this.setupIAmListener();
    }

    saveConfig() {
        writeConfig(this.clientOptions);
    }
}

module.exports = DeviceDiscovery;
