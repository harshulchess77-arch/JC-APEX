import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

// Serial port configuration (for USB/LoRa bridge)
let serialPort = null;
let parser = null;

// Initialize serial port if available
async function initializeSerialPort() {
  try {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(p => p.manufacturer?.includes('Arduino') || p.manufacturer?.includes('FTDI'));
    
    if (arduinoPort) {
      console.log(`Found serial port: ${arduinoPort.path}`);
      serialPort = new SerialPort({
        path: arduinoPort.path,
        baudRate: 115200,
      });
      
      parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      parser.on('data', (data) => {
        try {
          const telemetry = JSON.parse(data);
          // Broadcast telemetry to all connected web clients
          io.emit('telemetry', telemetry);
          console.log('Telemetry broadcasted:', telemetry);
        } catch (e) {
          console.error('Failed to parse serial data:', e);
        }
      });
      
      serialPort.on('error', (err) => {
        console.error('Serial port error:', err);
      });
      
      console.log('Serial port initialized successfully');
    } else {
      console.log('No Arduino/FTDI serial port found, running in mock mode');
    }
  } catch (e) {
    console.error('Failed to initialize serial port:', e);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial connection confirmation
  socket.emit('connected', { message: 'Connected to JC Apex telemetry server' });
  
  // Listen for telemetry from web clients (for testing without hardware)
  socket.on('telemetry', (data) => {
    console.log('Received telemetry from client:', data);
    // Broadcast to all other clients
    socket.broadcast.emit('telemetry', data);
  });
  
  // Listen for pit commands from Pit Center
  socket.on('pit_command', (commandData) => {
    console.log('Pit command received:', commandData);
    
    // Relay to driver HUD
    io.emit('pit_command', commandData);
    
    // Send to serial port/LoRa if available
    if (serialPort && serialPort.isOpen) {
      try {
        serialPort.write(JSON.stringify(commandData) + '\n');
        console.log('Command sent to serial port');
      } catch (e) {
        console.error('Failed to write to serial port:', e);
      }
    }
  });
  
  // Listen for director commands from Race Director
  socket.on('director_command', (commandData) => {
    console.log('Director command received:', commandData);
    
    // Relay to driver HUD
    io.emit('director_command', commandData);
    
    // Send to serial port/LoRa if available
    if (serialPort && serialPort.isOpen) {
      try {
        serialPort.write(JSON.stringify(commandData) + '\n');
        console.log('Command sent to serial port');
      } catch (e) {
        console.error('Failed to write to serial port:', e);
      }
    }
  });
  
  // Listen for driver acknowledgments
  socket.on('driver_ack', (ackData) => {
    console.log('Driver acknowledgment received:', ackData);
    
    // Relay to Pit Center and Race Director
    io.emit('driver_ack', ackData);
    
    // Send to serial port/LoRa if available
    if (serialPort && serialPort.isOpen) {
      try {
        serialPort.write(JSON.stringify(ackData) + '\n');
        console.log('Acknowledgment sent to serial port');
      } catch (e) {
        console.error('Failed to write to serial port:', e);
      }
    }
  });
  
  // Listen for driver status updates
  socket.on('driver_status', (statusData) => {
    console.log('Driver status update received:', statusData);
    
    // Relay to Pit Center and Race Director
    io.emit('driver_status', statusData);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Mock telemetry generator for testing (when no hardware connected)
let mockInterval = null;
function startMockTelemetry() {
  if (mockInterval) return;
  
  let mockData = {
    speed: 0,
    battery: 100,
    temp: 25,
    voltage: 48,
    current: 0,
    efficiency: 0,
    lap: 0,
    raceTime: 0,
  };
  
  mockInterval = setInterval(() => {
    mockData.speed = 20 + Math.random() * 15;
    mockData.battery = Math.max(0, mockData.battery - 0.1);
    mockData.temp = 30 + Math.random() * 20;
    mockData.voltage = 40 + Math.random() * 8;
    mockData.current = 5 + Math.random() * 10;
    mockData.efficiency = 60 + Math.random() * 30;
    mockData.lap += 0.01;
    mockData.raceTime += 1;
    
    io.emit('telemetry', mockData);
  }, 1000);
  
  console.log('Mock telemetry generator started');
}

// Start server
server.listen(PORT, () => {
  console.log(`JC Apex Telemetry Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  
  // Initialize serial port
  initializeSerialPort().then(() => {
    // Start mock telemetry if no serial port available
    if (!serialPort) {
      startMockTelemetry();
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  if (mockInterval) clearInterval(mockInterval);
  if (serialPort && serialPort.isOpen) serialPort.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
