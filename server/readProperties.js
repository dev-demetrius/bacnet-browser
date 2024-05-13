const { MongoClient } = require('mongodb');
const { readConfig } = require('./config');
const { readMultipleProperties } = require('./bacnetOperations');
const Device = require('./models/deviceModel');

async function fetchAndReadProperties() {
  const client = new MongoClient('mongodb://localhost:27017');
  let results = [];

  try {
    await client.connect();
    const devices = await Device.find();
    const config = readConfig();

    for (const device of devices) {
      if (!device.address || !device.network || device.mac === undefined) {
        console.error(`Missing details for device ${device._id}. Skipping...`);
        continue;
      }

      const address = {
        address: device.address,
        net: device.network,
        adr: [device.mac],
      };
      const propertiesToRead = config.objects.map((obj) => ({
        objectId: { type: obj.type, instance: obj.instance },
        properties: obj.properties.map((prop) => ({ id: prop.id })),
      }));

      try {
        const readResults = await readMultipleProperties(
          address,
          propertiesToRead,
        );
        device.properties = readResults.map((result) => {
          // Handle error objects and normal values differently
          const valueIsErrorObject =
            typeof result.values[0].value === 'object' &&
            result.values[0].value !== null;
          const valueText = valueIsErrorObject
            ? `Error: ${result.values[0].value.errorClass}-${result.values[0].value.errorCode}`
            : result.values[0].value;

          return {
            type: result.type,
            instance: result.instance,
            name: valueText, // Directly use valueText which handles both error and normal cases
            value: null,
          };
        });

        await device.save();
        results.push(device);
      } catch (error) {
        console.error(
          `Error reading properties for device ${device._id}: ${error}`,
        );
      }
    }
    return results;
  } finally {
    await client.close();
  }
}

module.exports = { fetchAndReadProperties };
