const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const serialPortPath = process.env.SERIAL_PORT_PATH || 'COM4';
const port = process.env.PORT || 3000;
const app = express();
const logFilePath = path.join(__dirname, 'api_log.json');
app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

const serialPort = new SerialPort({
    path: serialPortPath,
    baudRate: 9600, //115200
    autoOpen: false,
})

// Function to append data to the log file
async function logRequestData(data) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, body: data };
        const existingData = await fs.readFile(logFilePath, 'utf-8').catch(() => '[]');
        const logs = JSON.parse(existingData);
        logs.push(logEntry);
        await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
        console.log('Request body logged successfully.');
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

// const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Mở cổng serial
serialPort.open((err) => {
  if (err) {
    return console.error(`Không thể mở cổng serial: ${err.message}`);
  }
  console.log(`Serial port ${serialPortPath} đã được mở.`);
});

let currentML = 0;

const sendDataToSerialPort = async (data) => {
    if (!serialPort?.isOpen) {
        throw new Error('Serial port is not open.');
    }

    return new Promise((resolve, reject) => {
        serialPort.write(data + "\n", (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
                console.log(`Data sent to serial port: ${data}`);
            }
        });
    });
};

app.post('/api/send-data', async (req, res) => {
    try {
        await logRequestData(req.body);

        await sendDataToSerialPort(req.body);
        const jsonString = JSON.stringify(req.body);
        await sendDataToSerialPort(jsonString);
        res.json({ message: 'Data sent successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stop-resume', async (req, res) => {
    try {
        const jsonString = JSON.stringify(req.body);
        await sendDataToSerialPort(jsonString);
        res.json({ message: 'Stop signal sent.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});``

app.get('/api/current-ml', (req, res) => {
    res.json({ mL: currentML });
});

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await fs.readFile(logFilePath, 'utf-8').catch(() => '[]');
        res.json(JSON.parse(logs));
    } catch (error) {
        console.error('Error reading log file:', error);
        res.status(500).json({ error: 'Failed to read log file.' });
    }
});