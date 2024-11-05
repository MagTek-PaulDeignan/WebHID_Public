# MagTek WebSocket MMS Demo Integration Guide
This guide helps developers integrate MagTek card readers into their web applications using the JavaScript and WebSocket API, as demonstrated in the WebSocket MMS Demo.
## Prerequisites
Before starting the integration process, ensure you have the following:
- A MagTek-compatible card reader.
- Access to the Magensa Reader Management System (RMS) for device management.
- A modern web browser that supports WebSockets.
- Basic understanding of JavaScript and WebSocket communication.
## Required Modules and Libraries
The demo uses the following modules and libraries:
1.	Bootstrap CSS: Provides styling for the demo interface.
2.	JavaScript Module (mmsWebSocket.js): Manages the WebSocket communication with the MagTek card reader.
Include these references in your HTML:

<!DOCTYPE html>
<html lang="en">
<head>
    <title>MagTek WebSocket MMS Demo</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="./css/site.css"/>
    <script type="module" src="./js/mmsWebSocket.js"></script>
</head>
<body>
    <!-- WebSocket MMS Demo content here -->
</body>
</html>

### mmsWebSocket.js: This script handles the connection and communication between the web application and the card reader using WebSocket.
________________________________________
## Overview of the Sample Application
The sample application demonstrates:
1.	Establishing a WebSocket connection with the MagTek card reader.
2.	Sending commands to control the reader.
3.	Processing responses from the reader, such as card data, user prompts, and transaction status.
4.	Using pre-defined commands for EMV, NFC, MSR, and device management.
________________________________________

## Step-by-Step Integration

## Step 1: Establishing the WebSocket Connection
To communicate with the card reader, you need to establish a WebSocket connection. Below is an example of how to set up the connection:
````javascript

let socket;

// Function to open a WebSocket connection
function openWebSocket() {
    socket = new WebSocket('wss://rms.magensa.net/TEST/HID/mmsWebSocket');

    socket.onopen = function() {
        console.log('WebSocket connection established.');
        document.getElementById('lblUSBStatus').innerText = 'Connected';
    };

    socket.onmessage = function(event) {
        console.log('Message from server:', event.data);
        processResponse(event.data);
    };

    socket.onerror = function(error) {
        console.error('WebSocket Error:', error);
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed.');
        document.getElementById('lblUSBStatus').innerText = 'Disconnected';
    };
}

// Function to close the WebSocket connection
function closeWebSocket() {
    if (socket) {
        socket.close();
    }
}

// Event listeners for Open and Close buttons
document.getElementById('deviceOpen').addEventListener('click', openWebSocket);
document.getElementById('deviceClose').addEventListener('click', closeWebSocket);
````
## Step 2: Sending Commands to the Reader
Once the WebSocket connection is established, you can send commands to the card reader. Here’s an example of how to send a command:
````javascript
// Function to send a command via WebSocket
function sendCommand(command) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(command);
        console.log('Command sent:', command);
    } else {
        console.error('WebSocket is not open.');
    }
}

// Example: Sending a command to start an EMV transaction
document.getElementById('sendCommand').addEventListener('click', () => {
    const command = document.getElementById('sendData').value;
    sendCommand(command);
});
````
## Step 3: Handling Responses from the Reader
Responses from the reader are received through the onmessage event. Use the following code to process incoming messages:
````javascript
function processResponse(data) {
    document.getElementById('LogData').value += `\n${data}`;
    // Further processing can be done based on the command type and response
    if (data.includes('EMV')) {
        console.log('EMV response:', data);
    } else if (data.includes('NFC')) {
        console.log('NFC response:', data);
    }
}
````
________________________________________
### Command Documentation
Below is a partial  list of commands supported by the demo, including their descriptions and example values:
Command	Description	Example Value

- START EMV	Initiates an EMV transaction.	SENDCOMMAND,AA00810401001001842B100182013CA3098101018201018301018402000386159C01009F02060000000001009F0306000000000000
- CANCEL EMV	Cancels an ongoing EMV transaction.	SENDCOMMAND,AA0081040113100884021008
- Reset Device	Resets the reader to its initial state.	SENDCOMMAND,AA00810401121F0184021F01
- Get User Notify	Retrieves current user notification settings.	SENDCOMMAND,AA0081040155D101840FD1018501018704020701028902C100
- Set User Notify to All Events	Configures notifications for all user events.	SENDCOMMAND,AA0081040155D1118413D1118501018704020701028906C1048F000000
- Set DynaProx User Notify	Sets notifications for contactless and barcode events.	SENDCOMMAND,AA0081040155D1118413D1118501018704020701028906C10483000000
- START CONTACT	Begins a contact EMV transaction.	SENDCOMMAND,AA008104010010018430100182013CA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840
- START CONTACTLESS	Starts a contactless EMV transaction.	SENDCOMMAND,AA008104010010018430100182013CA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840
- START MSR	Initiates a magnetic stripe reader transaction.	SENDCOMMAND,AA008104010010018430100182013CA30981010182010083010084020003861A9C01009F02060000000001009F03060000000000005F2A020840
- Get SN	Retrieves the device serial number.	SENDCOMMAND,AA00810401B5D1018418D10181072B06010401F6098501028704020101018902C100
- Get Capabilities	Retrieves the capabilities of the reader.	SENDCOMMAND,AA00810401E0D101841AD10181072B06010401F609850102890AE208E106E104E102C200
- NFC	Starts an NFC transaction.	SENDCOMMAND,AA00810401031001843D1001820178A3098101008201008301038402020386279C01009F02060000000001009F03060000000000005F2A0208405F3601029F150200009F530100
- NFC Mifare	Initiates an NFC Mifare transaction.	SENDCOMMAND,AA00810401041100840C110081023000820100830100
- Display Amount	Displays the transaction amount on the device.	SENDCOMMAND,AA0081040155180384081803810100820101
- Display Approved	Shows an "Approved" message on the device screen.	SENDCOMMAND,AA0081040155180384081803810100820103
- Request PIN	Prompts the user to enter a PIN.	SENDCOMMAND,AA008104017A2001841C200181013C82010083020804850100A10B81010C8206123456789012
- User Selection 0/1	Captures user input for predefined options.	SENDCOMMAND,AA0081040100180284081802810100820100 (Selection 0)
- Set WebSocket Connections 1	Sets the WebSocket connection to handle 1 concurrent session.	SENDCOMMAND,AA0081040155D1118410D1118501018704020201018903CA0101
- Set WebSocket Connections 4	Sets the WebSocket connection to handle 4 concurrent sessions.	SENDCOMMAND,AA0081040155D1118410D1118501018704020201018903CA0104
________________________________________
## Troubleshooting
- WebSocket Connection Issues: Ensure the WebSocket URL is correct and the server is running.
- Device Not Found: Verify that the MagTek card reader is properly connected and that the WebSocket connection is established.
- Invalid Commands: Check the command format and ensure it matches the expected structure as shown in the command list.
________________________________________
## Conclusion
This guide provides the necessary steps and references to integrate MagTek card readers with your web application using the WebSocket MMS Demo. Use the provided functions and command list to customize the interaction with your reader. For further assistance, refer to MagTek's official documentation or support team.