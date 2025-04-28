const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');
require('dotenv').config();
const serialPortPath = process.env.SERIAL_PORT_PATH || '/dev/tty-usbserial1';
const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());


const serialPort = new SerialPort({
    path: serialPortPath,
    baudRate: 9600,
    autoOpen: false,
})

let currentML = 0;

const sendDataToSerialPort = async (data) => {
    if (!serialPort?.isOpen) {
        throw new Error('Serial port is not open.');
    }

    return new Promise((resolve, reject) => {
        serialPort.write(data, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

app.post('/api/send-data', async (req, res) => {
    const { data } = req.body;
    if (!data) {
        return res.status(400).json({ error: 'Data to send is required.' });
    }
    try {
        await sendDataToSerialPort(data);
        res.json({ message: 'Data sent successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stop-signal', async (req, res) => {
    try {
        await sendDataToSerialPort('STOP');
        res.json({ message: 'Stop signal sent.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/movement', async (req, res) => {
    const { mm } = req.body;
    if (mm === undefined || mm === null) {
        return res.status(400).json({ error: 'Movement distance (mm) is required.' });
    }
    try {
        await sendDataToSerialPort(`MOVE ${mm}`);
        res.json({ message: `Movement command sent: ${mm} mm` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/current-ml', (req, res) => {
    res.json({ mL: currentML });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
