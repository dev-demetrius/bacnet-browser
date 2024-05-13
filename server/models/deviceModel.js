const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
    type: { type: Number, required: true },
    instance: { type: Number, required: true },
    name: { type: String, required: false },
    value: { type: mongoose.Schema.Types.Mixed, required: false },
    cov: { type: Boolean, default: false },
    meta: { type: Object, default: {} },
});

const deviceSchema = new mongoose.Schema({
    deviceId: { type: Number, required: true, unique: true },
    address: { type: String, required: true },
    mac: { type: Number, required: true },
    maxApdu: { type: Number, required: true },
    name: { type: String, required: true },
    network: { type: Number, required: true },
    segmentation: { type: Number, required: true },
    vendorId: { type: Number, required: true },
    properties: [propertySchema], // Embedding Property schema
});

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
