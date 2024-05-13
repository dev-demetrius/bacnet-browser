const Bacnet = require("node-bacnet");

const client = new Bacnet({
    port: 47808, // Listening port, typically 47808 but adjusted as per your configuration
    broadcastAddress: "192.168.1.255", // Adjusted to match the local broadcast address of your network
    apduTimeout: 6000,
});

// BACnet object types and property identifiers
const OBJECT_DEVICE = 8; // Device object type
const PROP_OBJECT_NAME = 77; // Object_Name property identifier

client.on("iAm", (msg) => {
    console.log(msg);
});

client.on("error", (err) => {
    console.error("An error occurred:", err);
});

// Send a Who-Is request to discover devices
console.log("Sending Who-Is request...");
client.whoIs({ net: 201 });

// const requestArray = [
//     { objectId: { type: 8, instance: 3284282 }, properties: [{ id: 8 }] },
// ];
// client.readPropertyMultiple("192.168.1.252", requestArray, (err, value) => {
//     if (err) {
//         console.error("Error reading properties:", err);
//     } else {
//         console.log("Property values:", value);
//     }
// });
