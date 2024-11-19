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
// Change portPath depending on where it's plugged in
const portPath = 'COM8';

if (!portPath) {
  throw new Error('Serial port path is not defined.');
}

// Set up the serial port connection with baudRate
const serialPort = new SerialPort({ path: portPath, baudRate: 9600 });
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Variables to store the latest data
let hygrometerData = 0;
let flowRateData = 0;
let waterLevelData = 0;

let debounceTimeout;

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

  if (data.startsWith("Hygrometer Value:")) {
    const hygrometerValueStr = data.replace("Hygrometer Value:", "").trim();
    hygrometerData = parseInt(hygrometerValueStr, 10);
    console.log(`Parsed Hygrometer Value: ${hygrometerData}`);
    broadcastData(); // Broadcast data to all connected clients

  } else if (data.startsWith("Water Level:")) {
    const waterLevelStr = data.replace("Water Level:", "").trim();
    waterLevelData = parseInt(waterLevelStr, 10);
    console.log(`Parsed Water Level: ${waterLevelData}`);
    broadcastData(); // Send updated water level to clients

  } else if (data.startsWith("Flow Rate:")) {
    const flowRateStr = data.replace("Flow Rate:", "").trim();
    flowRateData = parseFloat(flowRateStr);
    console.log(`Parsed Flow Rate: ${flowRateData}`);
    broadcastData(); // Send updated flow rate to clients
  }
});

// API endpoint to serve the latest sensor data
app.get('/data', (req, res) => {
  res.json({
    hygrometer: hygrometerData,
    flowRate: flowRateData,
    waterLevel: waterLevelData
  });
});

// Create structured message to be sent to clients
function createMessage() {
  return JSON.stringify({
    hygrometer: hygrometerData,
    waterLevel: waterLevelData,
    flowRate: flowRateData
  });
}

// Broadcast the latest data to all WebSocket clients
function broadcastData() {
  const message = createMessage();

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