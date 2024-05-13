const bacnet = require("node-bacnet");
const client = new bacnet();
const { saveOrUpdateDevice } = require("./updateDevice");

let pollingInterval;

function startPolling(devices, interval = 30000) {
    // Default interval set to 30 seconds
    if (pollingInterval) {
        console.log("Polling already started.");
        return;
    }

    console.log(
        "Starting polling for devices:",
        devices.map((device) => device.deviceId)
    );

    pollingInterval = setInterval(() => {
        console.log("Polling BACnet devices for updates...");
        devices.forEach((device) => {
            const requestArray = device.properties.map((prop) => ({
                objectId: { type: prop.type, instance: prop.instance },
                properties: [{ id: 85 }], // Assuming ID 85 is the value property
            }));

            const address = {
                address: device.address,
                net: device.network,
                adr: [device.mac],
            };

            readMultipleProperties(address, requestArray)
                .then((results) => {
                    console.log("Polling results:", JSON.stringify(results));
                    updateDeviceProperties(device, results);
                    saveOrUpdateDevice(device);
                })
                .catch((error) => {
                    console.error(
                        `Error during polling for device ${device.deviceId}:`,
                        error
                    );
                });
        });
    }, interval);
}

async function readMultipleProperties(address, requestArray) {
    return new Promise((resolve, reject) => {
        client.readPropertyMultiple(address, requestArray, (err, data) => {
            if (err) {
                console.error("Error reading properties:", err);
                reject(err);
            } else {
                resolve(formatResponse(data));
            }
        });
    });
}

function updateDeviceProperties(device, results) {
    results.forEach((result) => {
        let prop = device.properties.find(
            (p) => p.type === result.type && p.instance === result.instance
        );
        if (prop) {
            prop.value = result.values[0].value; // Update only the value
        }
    });
}

function formatResponse(data) {
    let results = [];
    data.values.forEach((obj) => {
        obj.values.forEach((prop) => {
            results.push({
                type: obj.objectId.type,
                instance: obj.objectId.instance,
                values: prop.value, // Assuming the first value is the one we need
            });
        });
    });
    return results;
}

module.exports = { readMultipleProperties, startPolling };
