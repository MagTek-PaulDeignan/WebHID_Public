[Home](./MagTek_Demo_Project.md)

# MagTek Card Reader Integration Guide
This guide provides instructions for integrating MagTek card readers into your web applications using JavaScript and the WebHID API. It includes details about commands, their use cases, and code examples for implementing the integration.
Prerequisites
## Before you start, ensure you have:
    •	A compatible MagTek card reader.
    •	Basic knowledge of JavaScript and the WebHID API.
    •	A modern web browser that supports WebHID (e.g., Google Chrome).
    •	A local or web environment to host your JavaScript files.
    •	Optional access to Magensa’s Reader Management System (RMS).
## Required JavaScript Modules
### To use the demo code, make sure to include the following:
    1.	Bootstrap CSS: Used for styling.
    2.	JavaScript Module (v5demo.js): Contains the core logic for interacting with the MagTek reader.
Include these references in your HTML:

```` javascript
<!DOCTYPE html>
<html lang="en">
<head>
    <title>MagTek WebHID V5 Demo</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script type="module" src="./js/v5demo.js"></script>
</head>
<body>
    <!-- Your HTML Content Here -->
</body>
</html>
```` 
________________________________________
## Overview of the Sample Application
The sample application demonstrates how to:
    1.	Establish a WebHID connection with a MagTek card reader.
    2.	Send commands to the reader.
    3.	Process responses from the reader, such as card data and device information.
    4.	Use various commands for operations like starting EMV transactions, retrieving device information, and managing NFC.
________________________________________
## Step-by-Step Integration
### Step 1: Setting Up the WebHID Connection
To communicate with the card reader, you must first establish a WebHID connection. Here’s an example:
````javascript
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

// Function to close the device connection
async function closeDevice() {
    if (device && device.opened) {
        await device.close();
        console.log('Device disconnected');
    }
}

// Event listeners for buttons
document.getElementById('deviceOpen').addEventListener('click', openDevice);
document.getElementById('deviceClose').addEventListener('click', closeDevice);
````
### Step 2: Sending Commands to the Reader
With the reader connected, you can send commands to perform various operations. Here’s an example of sending a command:
````javascript

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

// Example: Sending a command to get the KSN (Key Serial Number)
document.getElementById('sendCommand').addEventListener('click', () => {
    const command = document.getElementById('sendData').value;
    sendCommand(command);
});
````
### Step 3: Handling Responses from the Reader
Handle incoming data from the reader using the oninputreport event:
````javascript
device.oninputreport = event => {
    const decoder = new TextDecoder();
    const data = decoder.decode(event.data);
    console.log('Received data:', data);

    // Process specific responses
    if (data.includes('KSN')) {
        console.log('Received KSN:', data);
    } else if (data.includes('Firmware Version')) {
        console.log('Firmware Version:', data);
    } else {
        console.log('Other Response:', data);
    }
};
````
### Step 4: Documenting All Commands

Below is a partial list of all commands that can be used with the MagTek card reader, as referenced in the demo:
Command	Description	Example Value
- GET KSN	Retrieve the Key Serial Number of the device.	SENDCOMMAND,0900
- START Transaction - No Timeout	Starts a transaction without a timeout.	SENDCOMMAND,491900000300001300078000000000100000000000000000084001
- GET Firmware	Retrieves the firmware version of the reader.	SENDCOMMAND,000100
- GET Serial Number	Retrieves the serial number of the reader.	SENDCOMMAND,000103
- GET MUT	Retrieves the Mutual Authentication Token (MUT).	SENDCOMMAND,1900
- SET Date/Time	Sets the date and time on the device.	SENDDATETIME
- GET App Version	Retrieves the version of the running application.	GETAPPVERSION
- GET Device Info	Retrieves basic device information.	GETDEVINFO
- GET Output Channel	Checks the current output channel configuration.	SENDCOMMAND,4800
- SET USB Output Channel	Configures the reader to use USB as the output channel.	SENDCOMMAND,480100
- START EMV	Starts an EMV transaction.	SENDCOMMAND,49190000030000131E028000000000100000000000000000084002
- START Contactless EMV	Initiates a contactless EMV transaction.	SENDCOMMAND,491900000300001300048000000000100000000000000000084002
- START Both EMV	Initiates both EMV and contactless transactions.	SENDCOMMAND,49190000030000131E068000000000100000000000000000084001
- START 3 EMV	Starts a three-step EMV process.	SENDCOMMAND,49190000030000131E078000000000100000000000000000084001
- GET SPI Status	Checks the status of the Secure PIN Entry (SPI).	SENDEXTENDEDCOMMAND,0501,00
- GET MSR Length	Retrieves the length of the magnetic stripe data.	SENDEXTENDEDCOMMAND,0500,00FFFFFFFFFF
- GET More	Retrieves additional data from a previous command.	SENDEXTENDEDCOMMAND,004A,
- GET SPI	Retrieves SPI data.	GETSPIDATA,600
- Cancel EMV	Cancels an ongoing EMV transaction.	SENDEXTENDEDCOMMAND,0304,00
- START NFC	Starts an NFC transaction.	SENDCOMMAND,491900000300001300072100000000150000000000000000084002
- NFC Read Version	Reads the version of NFC.	SENDCOMMAND,491900000330001300000000000000000000000000000000000060
- NFC Read Data	Reads data from an NFC transaction.	SENDCOMMAND,49190000033000140000000000000000000000000000000000003000
- UPDATE Device	Updates the device firmware using RMS.	UPDATEDEVICE

### Step 5: Closing the Connection
Always close the connection when the reader is no longer needed:
````javascript
async function closeDevice() {
    if (device && device.opened) {
        await device.close();
        console.log('Device closed');
    }
}
````
________________________________________
### Troubleshooting
    •	Device Not Found: Make sure your browser supports WebHID and that the MagTek reader is properly connected.
    •	Command Errors: Verify that the command strings match the required format. Check for typos or incorrect command structure.
    •	Connection Issues: Ensure that the device is opened properly before attempting to send commands.
________________________________________
### Conclusion
This guide covers the integration of MagTek card readers using JavaScript, WebHID, and the commands provided in the HID V5 Demo. Use the provided functions and command list to integrate and customize the interaction with your card reader. For further support, refer to the official MagTek documentation or contact MagTek support.

