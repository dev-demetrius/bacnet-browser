const express = require('express');
const bodyParser = require('body-parser');
const DeviceDiscovery = require('./deviceManager');
const { saveOrUpdateDevice } = require('./updateDevice');
const {
  readMultipleProperties,
  startPolling,
  pollingResults,
} = require('./bacnetOperations');
const { fetchAndReadProperties, fetchAllDevices } = require('./readProperties');
const Device = require('./models/deviceModel');
const { connectDatabase } = require('./database');
const { initOPCUAServer, constructOPCUAServer } = require('./opcua/server'); // Import OPC UA Server initialization function

const discovery = new DeviceDiscovery();
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/devices', (req, res) => {
  res.json(discovery.devices);
});

// Define all your routes in a function to be called after the database connection is established
function defineRoutes() {
  app.get('/test', async (req, res) => {
    try {
      // Create a new device
      const newDevice = new Device({
        deviceId: 123,
        address: '192.168.1.252',
        mac: 15,
        maxApdu: 480,
        name: 'New Device',
        network: 201,
        segmentation: 3,
        vendorId: 28,
        properties: [
          {
            type: 0,
            instance: 3,
            name: 'Temperature',
            value: 22.5,
            cov: true,
            meta: {},
          },
        ],
      });

      // Save the new device
      const savedDevice = await newDevice.save();
      console.log('Device saved:', savedDevice);

      // Update a property in the device
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId: 123, 'properties.instance': 3 },
        { $set: { 'properties.$.value': 23.0 } },
        { new: true },
      );

      console.log('Updated device:', updatedDevice);
      res.status(200).json({
        success: true,
        message: 'Device created and updated successfully',
        data: updatedDevice,
      });
    } catch (error) {
      console.error('Error in /test route:', error);
      res.status(500).send(error.message);
    }
  });

  app.post('/config', async (req, res) => {
    try {
      const {
        broadcastAddress,
        port,
        startNetwork,
        endNetwork,
        adpuTimeout,
        startMac,
        endMac,
      } = req.body;
      await discovery.updateConfig({
        // Use the updateConfig method
        broadcastAddress,
        port,
        startNetwork,
        endNetwork,
        adpuTimeout,
        startMac,
        endMac,
      });
      discovery.initializeClient();
      await discovery.discoverDevices(
        startNetwork,
        endNetwork,
        startMac,
        endMac,
      );
      res.send('Configuration updated and device discovery initiated.');
    } catch (error) {
      console.error('Error in /config route:', error);
      res.status(500).send(error.message);
    }
  });

  app.post('/save-device', async (req, res) => {
    try {
      const devices = req.body; // Expecting an array of devices
      if (!Array.isArray(devices)) {
        return res
          .status(400)
          .send('Invalid input, expected an array of devices');
      }

      for (const device of devices) {
        await saveOrUpdateDevice(device);
      }

      res.json({ message: 'All devices processed successfully' });
    } catch (error) {
      console.error('Error saving devices:', error);
      res.status(500).send('Failed to save devices');
    }
  });

  app.post('/read-properties', async (req, res) => {
    const { address, properties } = req.body;
    try {
      const results = await readMultipleProperties(address, properties);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to read properties',
        error: error.toString(),
      });
    }
  });

  app.get('/properties', async (req, res) => {
    try {
      const propertiesResults = await fetchAndReadProperties();
      // Check if propertiesResults is defined and log the results for debugging
      console.log('Properties Results:', propertiesResults);
      if (!propertiesResults || propertiesResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No properties found.',
        });
      }
      res.json({
        success: true,
        data: propertiesResults,
      });
    } catch (error) {
      console.error('Failed to fetch and save properties:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to read and save properties',
        error: error.toString(),
      });
    }
  });

  let isPollingStarted = false;

  app.get('/poll-devices', async (req, res) => {
    if (!isPollingStarted) {
      const devices = await fetchAndReadProperties();
      startPolling(devices);
      isPollingStarted = true;
    }
    res.json({
      success: true,
      message: 'Polling started',
      data: pollingResults,
    });
  });

  function sendProgressUpdate(progress) {
    currentProgress = progress; // Update global variable
  }
}

async function startApplication() {
  try {
    await connectDatabase();
    console.log('Database connected successfully.');
    defineRoutes(); // Define routes after successful database connection

    constructOPCUAServer();
    console.log('OPC UA Server started successfully.');

    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1); // Exit if database connection fails or server cannot start
  }
}

startApplication();
