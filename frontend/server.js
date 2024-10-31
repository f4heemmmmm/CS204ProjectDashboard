import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
};

const port = 3000;
const portPath = 'COM8';

if (!portPath) {
  throw new Error('Serial port path is not defined.');
}

// Set up the serial port connection with baudRate
const serialPort = new SerialPort({ path: portPath, baudRate: 9600 });
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Define buffer sizes
const BUFFER_SIZE = 20;

// Arrays to store the latest data
let hygrometerData = new Array(BUFFER_SIZE).fill(0);
let flowRateData = new Array(BUFFER_SIZE).fill(0);
let waterLevelData = 0;

// Index to keep track of the current position in the buffer
let currentHIndex = 0;
let currentFIndex = 0;

// Timestamps to keep track of data points
let hygrometerTimestamps = new Array(BUFFER_SIZE).fill(0);
let flowRateTimestamps = new Array(BUFFER_SIZE).fill(0);
const MAX_AGE = 25000; // 20 seconds

// Create a WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Optionally send the latest data immediately upon connection
  const initialMessage = createMessage();
  ws.send(initialMessage);

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Listen for data from the serial port
parser.on('data', (data) => {
  console.log(`Received from Arduino: ${data}`); // Log the raw data
  const currentMillis = Date.now();

  if (data.startsWith("Hygrometer Value:")) {
    const hygrometerValueStr = data.replace("Hygrometer Value:", "").trim();
    const hygrometerValue = parseInt(hygrometerValueStr, 10);

    // Directly store in the circular buffer
    hygrometerData[currentHIndex] = hygrometerValue;
    hygrometerTimestamps[currentHIndex] = currentMillis;
    console.log(`Parsed Hygrometer Value: ${hygrometerValue} at Index ${currentHIndex}`);

    // Increment index and wrap around if necessary
    currentHIndex = (currentHIndex + 1) % BUFFER_SIZE;
    broadcastData(); // Broadcast data to all connected clients

  } else if (data.startsWith("Water Level:")) {
    const waterLevelStr = data.replace("Water Level:", "").trim();
    waterLevelData = parseInt(waterLevelStr, 10);

    console.log(`Parsed Water Level: ${waterLevelData}`);
    broadcastData(); // Send updated water level to clients

  } else if (data.startsWith("Flow Rate:")) {
    const flowRateStr = data.replace("Flow Rate:", "").trim();
    const flowRate = parseFloat(flowRateStr);

    // Store in the circular buffer
    flowRateData[currentFIndex] = flowRate;
    flowRateTimestamps[currentFIndex] = currentMillis;
    console.log(`Stored Flow Rate: ${flowRate} at Index ${currentFIndex}`);

    // Increment index and wrap around if necessary
    currentFIndex = (currentFIndex + 1) % BUFFER_SIZE;
    broadcastData(); // Send updated flow rate to clients
  }

  // Remove old data for hygrometer
  for (let i = 0; i < BUFFER_SIZE; i++) {
    if (currentMillis - hygrometerTimestamps[i] > MAX_AGE) {
      hygrometerData[i] = 0;
      hygrometerTimestamps[i] = 0;
      console.log(`Discarded old hygrometer data at Index ${i}`);
    }
  }

  // Remove old data for flow rate
  for (let i = 0; i < BUFFER_SIZE; i++) {
    if (currentMillis - flowRateTimestamps[i] > MAX_AGE) {
      flowRateData[i] = 0;
      flowRateTimestamps[i] = 0;
      console.log(`Discarded old flow rate data at Index ${i}`);
    }
  }
});

app.get('/data', (req, res) => {
  res.json({
    hygrometer: hygrometerData,
    flowRate: flowRateData,
    waterLevel: waterLevelData
  });
});

// Create structured message to be sent to clients
function createMessage() {
  const validHygrometerData = hygrometerData.filter(value => value !== 0);
  const validFlowRateData = flowRateData.filter(value => value !== 0);
  
  return JSON.stringify({
    hygrometer: validHygrometerData,
    waterLevel: waterLevelData,
    flowRate: validFlowRateData
  });
}

function broadcastData() {
  const validHygrometerData = hygrometerData.filter(value => value !== 0);
  const validFlowRateData = flowRateData;

  // Check if valid data exists before broadcasting
  console.log('Broadcasting Hygrometer Data:', validHygrometerData);
  console.log('Broadcasting Flow Rate Data:', validFlowRateData);

  const message = JSON.stringify({
    hygrometer: validHygrometerData,
    // waterLevel: waterLevelData,
    flowRate: validFlowRateData
  });

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// Start the Express server
const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// Upgrade the HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});