const { OPCUAServer, Variant, DataType } = require("node-opcua");
const Device = require("../models/deviceModel");

let deviceCache = {};

async function updateDeviceCache() {
    try {
        const devices = await Device.find();
        devices.forEach((device) => {
            deviceCache[device._id] = device;
        });
    } catch (error) {
        console.error("Error updating device cache:", error);
    }
}

async function constructOPCUAServer() {
    const server = new OPCUAServer({
        port: 4334,
        resourcePath: "/UA/BACnetServer",
        buildInfo: {
            productName: "BACnet OPC UA Server",
            buildNumber: "7658",
            buildDate: new Date(),
        },
    });

    await server.initialize();
    console.log("OPC UA Server initialized");

    await updateDeviceCache(); // Initialize cache
    setInterval(updateDeviceCache, 30000); // Update cache every 30 seconds

    await constructAddressSpace(server);

    await server.start();
    console.log(
        `Server is now listening on port ${server.endpoints[0].port}...`
    );
    console.log(
        `the primary server endpoint url is ${
            server.endpoints[0].endpointDescriptions()[0].endpointUrl
        }`
    );
}

async function constructAddressSpace(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();
    const devicesFolder = namespace.addFolder("ObjectsFolder", {
        browseName: "BACnetDevices",
    });

    for (let deviceId in deviceCache) {
        const device = deviceCache[deviceId];
        const deviceFolder = namespace.addFolder(devicesFolder, {
            browseName: device.name || "Unnamed Device",
        });

        device.properties.forEach((prop) => {
            namespace.addVariable({
                componentOf: deviceFolder,
                nodeId: `s=${deviceId}-${prop.type}-${prop.instance}`,
                browseName: prop.name,
                dataType: "Double",
                minimumSamplingInterval: 30000,
                value: {
                    get: () =>
                        new Variant({
                            dataType: DataType.Double,
                            value: deviceCache[deviceId].properties.find(
                                (p) =>
                                    p.type === prop.type &&
                                    p.instance === prop.instance
                            ).value,
                        }),
                },
            });
        });
    }
}

module.exports = { constructOPCUAServer };
