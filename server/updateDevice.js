// updateDevice.js
const { MongoClient } = require("mongodb");

async function connect() {
    const url = "mongodb://localhost:27017";
    const client = new MongoClient(url);
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("bacnet");
}

async function saveOrUpdateDevice(device) {
    const db = await connect();
    const collection = db.collection("devices");

    const result = await collection.updateOne(
        { deviceId: device.deviceId },
        { $set: device },
        { upsert: true }
    );

    console.log(
        `Processed device ${device.deviceId}. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedId}`
    );
    return result;
}

function updateDeviceProperties(device, results) {
    const updatedProperties = device.properties.map((property) => {
        const correspondingResult = results.find(
            (result) =>
                result.type === property.type &&
                result.instance === property.instance
        );

        // Check if correspondingResult exists and has values
        let newValue = property.value; // default to existing value if no update is found
        if (
            correspondingResult &&
            correspondingResult.values &&
            correspondingResult.values.length > 0
        ) {
            // Check if the value field is an object and has 'errorClass' to handle error values differently
            if (
                correspondingResult.values[0].value &&
                correspondingResult.values[0].value.errorClass
            ) {
                newValue = correspondingResult.values[0].value;
            } else {
                // Assume it's a normal value update
                newValue = correspondingResult.values[0].value;
            }
        }

        return {
            type: property.type,
            instance: property.instance,
            name: property.name, // Keep the original name
            value: newValue, // Set new or existing value
            cov: property.cov || false, // Preserve or default to false
            meta: property.meta || {}, // Preserve or default to empty object
        };
    });

    console.log(
        `Updated properties for device ${device.deviceId}:`,
        JSON.stringify(updatedProperties, null, 2)
    );
    return updatedProperties;
}

module.exports = { saveOrUpdateDevice, updateDeviceProperties };
