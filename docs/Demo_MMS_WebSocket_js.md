# MagTek WebSocket MMS Demo Documentation

## Table of Contents

- [Overview](#overview)
- [Modules and Dependencies](#modules-and-dependencies)
- [HTML Structure](#html-structure)
- [Key Functionalities](#key-functionalities)
  - [USB Connection Status](#usb-connection-status)
  - [Device Controls](#device-controls)
  - [Command Data Input and Processing](#command-data-input-and-processing)
  - [Command List Dropdown](#command-list-dropdown)
- [JavaScript Implementation](#javascript-implementation)
  - [WebSocket Communication](#websocket-communication)
  - [Command Handling](#command-handling)
- [Event Handling](#event-handling)
- [License](#license)

---

## Overview

The MagTek WebSocket MMS Demo provides an interactive interface for testing and interacting with MagTek's DynaFlex II PED device via WebSocket communication. This demo includes device connection, command execution, and WebSocket-specific features like managing concurrent connections.

Devices supported include:
- DynaFlex II PED
---

## Modules and Dependencies

### CSS and JavaScript Resources

1. Bootstrap CSS:
   - URL: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`
   - Provides responsive design and UI components.

2. Site-specific CSS:
   - File: `./css/site.css`
   - Custom styling for the demo interface.

3. JavaScript Modules:
   - mt_Utils: Provides utility functions for encoded values, delays, and data parsing.
   - mt_UI: Manages UI updates such as logs and display messages.
   - mt_WSS: WebSocket API to establish and manage device communication.
   - mt_events: Event emitter for managing device events.

---

## HTML Structure

### Header Section

The header includes the MagTek logo and the title of the application:

```html
<div class="container">
  <a href="index.html">
    <img src="./images/magtek_logo.png" alt="Logo" width="150">
  </a>
</div>
<div class="container">
  <h1>WebSocket MMS Demo</h1>
</div>
```

### Main Body

#### USB Connection Status

Displays the USB connection status using an image and text indicator:

```html
<img id="USBStatus" src="./images/usb-disconnected.png">
<span id="lblUSBStatus">Disconnected</span>
```

#### Device Controls

Buttons for managing the device connection:

```html
<button class="btn btn-primary" id="deviceOpen">Open</button>
<button class="btn btn-primary" id="deviceClose">Close</button>
<button class="btn btn-primary" id="clearCommand">Clear</button>
```

#### Command Data Input and Processing

Input field and button for sending commands to the device:

```html
<input type="text" class="form-control" name="sendData" id="sendData">
<button class="btn btn-primary" id="sendCommand">Send Command</button>
```

#### Command List Dropdown

Dropdown menu with pre-defined commands:

```html
<select class="form-control-3" name="CommandList" id="CommandList">
  <option value="SENDCOMMAND,AA00810401001001842B100182013CA3098101018201018301018402000386159C01009F02060000000001009F0306000000000000">START EMV</option>
  <option value="SENDCOMMAND,AA0081040113100884021008">CANCEL EMV</option>
  <option value="SENDCOMMAND,AA00810401121F0184021F01">Reset Device</option>
  <option value="SENDCOMMAND,AA0081040155D101840FD1018501018704020701028902C100">Get User Notify</option>
  <!-- Additional options here -->
</select>
```

---

## Key Functionalities

### USB Connection Status

Displays the real-time status of the USB connection using an image and label. The status updates dynamically based on the device state.

### Device Controls

- Open: Initiates the connection to the device.
- Close: Terminates the connection.
- Clear: Clears the logs and input fields.

### Command Data Input and Processing

Users can input custom commands into the `sendData` field and execute them using the "Send Command" button. The results appear in the log section.

### Command List Dropdown

Provides pre-defined commands for common device operations such as starting EMV, canceling EMV, and resetting the device.

---

## JavaScript Implementation

### WebSocket Communication

The `Demo_mmsWebSocket.js` file establishes and manages WebSocket connections, allowing multiple concurrent connections as per the pre-defined commands.

#### Example Commands for WebSocket Connections

- Set WebSocket Connections to 1:
  ```javascript
  SENDCOMMAND,AA0081040155D1118410D1118501018704020201018903CA0101
  ```

- Set WebSocket Connections to 4:
  ```javascript
  SENDCOMMAND,AA0081040155D1118410D1118501018704020201018903CA0104
  ```

### Command Handling

The WebSocket commands are processed through a robust handler that supports:

- Sending commands
- Managing device state transitions
- Handling responses asynchronously

#### Example Command Handling Logic

- Send Command:
  ```javascript
  function sendCommand(command) {
    // Logic to send a WebSocket command to the device
  }
  ```

- Handle WebSocket Connection Change:
  ```javascript
  function setWebSocketConnections(connectionCount) {
    // Logic to adjust the number of WebSocket connections
  }
  ```

---

## Event Handling

### Subscribed Events

Event listeners provide real-time feedback on device interactions, including input reports, barcode detection, contactless events, and errors.

#### Example Events

- OnDeviceConnect: Triggered when a device is connected.
  ```javascript
  EventEmitter.on("OnDeviceConnect", (e) => {
    mt_UI.setUSBConnected("Connected");
  });
  ```

- OnContactlessCardDetected: Triggered when a contactless card is detected.
  ```javascript
  EventEmitter.on("OnContactlessCardDetected", async (e) => {
    mt_UI.LogData(`Contactless Card Detected`);
  });
  ```

- OnError: Captures error details.
  ```javascript
  EventEmitter.on("OnError", (e) => {
    mt_UI.LogData(`Error: ${e.Source} ${JSON.stringify(e.Data)}`);
  });
  ```

---

## License

```plaintext
Copyright 2020-2024 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```