## MagTek HID MMS Demo Integration Guide
This guide is designed to help developers integrate MagTek card readers into their web applications using the JavaScript code provided in the HID MMS Demo. It includes details on setting up the environment, using the WebHID API, and working with various device commands.
Prerequisites
## Before beginning the integration process, ensure you have:
    •	A MagTek-compatible card reader.
    •	Access to the Magensa Reader Management System (RMS) for device management.
    •	A modern web browser that supports WebHID (e.g., Google Chrome).
    •	Basic understanding of JavaScript and the WebHID API.
## Required Modules and Libraries
To utilize the sample code, include the following references in your HTML:
    1.	Bootstrap CSS: Used for styling.
    2.	JavaScript Module (mmsdemo.js): Contains the logic for device communication.

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
    <title>MagTek HID MMS Demo</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="./css/site.css"/>
    <script type="module" src="./js/mmsdemo.js"></script>
</head>
<body>
    <!-- Your HTML content and interface here -->
</body>
</html>
```

•	mmsdemo.js: This JavaScript module manages the connection with the MagTek reader and handles command interactions. Ensure this file is correctly linked in your project.
________________________________________
# Overview of the Sample Application
The sample application enables developers to:
    1.	Connect to a MagTek card reader using the WebHID API.
    2.	Send various commands to control the reader.
    3.	Process and display responses, including card data, PIN entry, and transaction status.
    4.	Use pre-defined commands for EMV, NFC, MSR, and device control.
________________________________________
# Step-by-Step Integration
## Step 1: Establishing the WebHID Connection
The mmsdemo.js module provides the functions necessary to connect to the card reader using the WebHID API. Here’s a basic example of how to establish a connection:
```javascript

let device;

// Function to request the device connection
async function openDevice() {
    try {
        const devices = await navigator.hid.requestDevice({
            filters: [{ vendorId: 0x0801 }] // Replace with the correct Vendor ID for MagTek
        });
        device = devices[0];
        await device.open();
        console.log('Device connected:', device.productName);
    } catch (error) {
        console.error('Error connecting to device:', error);
    }
}

// Function to close the connection
async function closeDevice() {
    if (device && device.opened) {
        await device.close();
        console.log('Device disconnected');
    }
}

// Event listeners for buttons
document.getElementById('deviceOpen').addEventListener('click', openDevice);
document.getElementById('deviceClose').addEventListener('click', closeDevice);
```

## Step 2: Sending Commands to the Reader
Once connected, you can send commands to the card reader to perform various actions. Here’s an example:
```javascript
// Function to send a command to the reader
async function sendCommand(command) {
    if (!device || !device.opened) {
        console.error('Device is not connected');
        return;
    }

    const encoder = new TextEncoder();
    const commandBytes = encoder.encode(command);

    try {
        await device.sendReport(0x00, commandBytes);
        console.log('Command sent:', command);
    } catch (error) {
        console.error('Error sending command:', error);
    }
}

// Example: Sending a command to start an EMV transaction
document.getElementById('sendCommand').addEventListener('click', () => {
    const command = document.getElementById('sendData').value;
    sendCommand(command);
});
```

## Step 3: Handling Responses from the Reader
The reader will send responses via the oninputreport event, which you can handle as follows:
```javascript
device.oninputreport = event => {
    const decoder = new TextDecoder();
    const data = decoder.decode(event.data);
    console.log('Received data:', data);

    // Handle specific responses
    if (data.includes('EMV')) {
        console.log('EMV response received:', data);
    } else {
        console.log('Other response:', data);
    }
};
```
________________________________________
## Troubleshooting
    •	Device Not Found: Ensure that your browser supports WebHID and that the MagTek reader is properly connected to a USB port.
    •	Command Errors: Verify the structure and formatting of the command strings.
    •	Connection Issues: Ensure that the device is properly opened before attempting to send commands.
________________________________________
## Conclusion
