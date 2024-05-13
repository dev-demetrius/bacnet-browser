const Bacnet = require("node-bacnet");

const client = new Bacnet({
    port: 47808, // default BACnet port
    broadcastAddress: "192.168.1.255", // adjust to your network
    apduTimeout: 80000,
    segmentTimeout: 80000, // adjust as necessary
    maxSegments: 10, // adjust as necessary
});

// client.readProperty(
//     { address: "192.168.1.252", net: 201, adr: [11] },
//     { type: 8, instance: 101 },
//     76,
//     (err, value) => {
//         if (err) {
//             console.error(err);
//             return;
//         }

//         console.log(value);
//     }
// );
// client.readProperty(
//     { address: "192.168.1.252", net: 201, adr: [3] },
//     { type: 8, instance: 3284282 },
//     77,
//     (err, value) => {
//         if (err) {
//             console.error(`Error reading Object_Name for device `, err);
//             return;
//         }

//         let deviceName = value.values[0].value;
//         console.log(`Name: ${deviceName}`);
//     }
// );
// client.readProperty(
//     { address: "192.168.1.252", net: 201, adr: [11] },
//     { type: 8, instance: 101 },
//     77,
//     (err, value) => {
//         if (err) {
//             console.error(`Error reading Object_Name for device `, err);
//             return;
//         }

//         let deviceName = value.values[0].value;
//         console.log(`Name: ${deviceName}`);
//     }
// );

// const requestArray = [
//     { objectId: { type: 8, instance: 418 }, properties: [{ id: 8 }] },
// ];
// client.readPropertyMultiple(
//     { address: "192.168.1.252", net: 201, adr: [15] },
//     requestArray,
//     (err, value) => {
//         console.log("Value: ", value);
//     }
// );

// Prepare the request array with objects and properties you want to read
// Simplified request array to just read the object name
const requestArray = [
    { objectId: { type: 0, instance: 3 }, properties: [{ id: 85 }] },
    { objectId: { type: 2, instance: 1 }, properties: [{ id: 85 }] },
    { objectId: { type: 4, instance: 1 }, properties: [{ id: 85 }] },
];

const targetDevice = {
    address: "192.168.1.252",
    net: 201,
    adr: [15],
};

client.readPropertyMultiple(targetDevice, requestArray, (err, value) => {
    if (err) {
        console.error("Error reading multiple properties:", err);
    } else {
        // Stringify the value object to view its full structure in the console
        console.log("Value: ", JSON.stringify(value, null, 2));
    }
});

// {
//     "address": "192.168.1.252", "net": 201, "adr": [11],
//     "properties": [
//       { "objectId": { "type": 0, "instance": 3 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 1 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 3 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 4 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 5 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 6 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 7 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 8 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 2, "instance": 21 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 4, "instance": 1 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 4, "instance": 2 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 4, "instance": 3 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 4, "instance": 4 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 4, "instance": 5 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 4, "instance": 6 }, "properties": [{ "id": 85 }] },
//       { "objectId": { "type": 17, "instance": 1 }, "properties": [{ "id": 85 }] }
//     ]
//   }
