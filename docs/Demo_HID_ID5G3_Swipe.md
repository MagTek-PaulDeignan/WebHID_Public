# MagTek WebHID ID5G3 Demo Documentation

## Overview

This HTML page and its associated JavaScript provide a demo interface for interacting with MagTek ID5G3 devices via WebHID. The demo offers functionality to connect to the device, send commands, retrieve device information, and update firmware, along with an intuitive user interface.

Key Features:
- Communication with MagTek ID5G3 devices using WebHID.
- Command execution and device interaction.
- Real-time status logging and user-friendly feedback.
- RMS integration for device firmware updates.

Devices supported include:
- iDynamo 5 Gen III
---

## Table of Contents

- [Page Structure](#page-structure)
- [Features](#features)
- [Command List](#command-list)
- [Event Handlers](#event-handlers)
- [License](#license)

---

## Page Structure

### Key Elements

- Device Display and Logs:
  Displays the current device status and logs for user interaction and debugging.
  ```html
  <div id="DeviceDisplay">WELCOME</div>
  <textarea class="form-control" name="LogData" id="LogData" rows="12"></textarea>
  <div class="form-group container-left">
    <img id="USBStatus" src="./images/usb-disconnected.png"><span id="lblUSBStatus">Disconnected</span>
  </div>
  ```

- Control Buttons:
  Provides controls to open or close the device, clear logs, and send commands.
  ```html
  <button class="btn btn-primary" id="deviceOpen">Open</button>
  <button class="btn btn-primary" id="deviceClose">Close</button>
  <button class="btn btn-primary" id="clearCommand">Clear</button>
  ```

- Command Input and Dropdown:
  Allows users to enter custom commands or select predefined commands to send to the device.
  ```html
  <input type="text" class="form-control" name="sendData" id="sendData" value="SENDCOMMAND,490700000000000100">
  <button class="btn btn-primary" id="sendCommand">Send Command</button>
  <select class="form-control-3" name="CommandList" id="CommandList">
    <option value="SENDCOMMAND,490700000000000100">GET FIRMWARE</option>
    <option value="SENDCOMMAND,490700000000000103">GET SN</option>
    <option value="SENDCOMMAND,490700000000000122">GET End of Message</option>
    <option value="SENDCOMMAND,490700000000000184">GET Device Model Name</option>
    <option value="SENDCOMMAND,490700000000000110">GET Device Interface</option>
    <option value="SENDCOMMAND,4906000000020000">Reset Device</option>
    <option value="GETAPPVERSION">GET APP VERSION</option>
    <option value="GETDEVINFO">GET DEVICE INFO</option>
    <option value="UPDATEDEVICE">RMS Update Device</option>
  </select>
  ```

---

## Features

### Device Connection
- Open Device: Establishes a connection with the MagTek ID5G3 device.
  ```html
  <button class="btn btn-primary" id="deviceOpen">Open</button>
  ```

- Close Device: Disconnects from the device.
  ```html
  <button class="btn btn-primary" id="deviceClose">Close</button>
  ```

### Command Execution
Send commands directly using the input box or select from a dropdown of predefined commands for common tasks like retrieving firmware details or resetting the device.

### Logging and Status Display
Provides real-time feedback and device status updates in a log area, aiding in debugging and interaction.

---

## Command List

| Command                                | Description                         |
|---------------------------------------|-------------------------------------|
| `SENDCOMMAND,490700000000000100`       | Retrieve the firmware version.      |
| `SENDCOMMAND,490700000000000103`       | Retrieve the serial number.         |
| `SENDCOMMAND,490700000000000122`       | Retrieve end of message.            |
| `SENDCOMMAND,490700000000000184`       | Retrieve device model name.         |
| `SENDCOMMAND,490700000000000110`       | Retrieve device interface details.  |
| `SENDCOMMAND,4906000000020000`         | Reset the device.                   |
| `GETAPPVERSION`                        | Retrieve application version.       |
| `GETDEVINFO`                           | Retrieve device information.        |
| `UPDATEDEVICE`                         | Perform an RMS firmware update.     |

---

## Event Handlers

### Key Event Handlers

1. Device Connection:
   Updates the user interface based on the device's connection status.
   ```javascript
   const deviceConnectLogger = (e) => {
     mt_UI.setUSBConnected("Connected");
   };
   const deviceDisconnectLogger = (e) => {
     mt_UI.setUSBConnected("Disconnected");
   };
   ```

2. Command Execution:
   Handles commands sent to the device, parsing the user input and executing predefined actions.
   ```javascript
   async function handleSendCommandButton() {
     const data = document.getElementById("sendData");
     await parseCommand(data.value);
   }
   ```

3. Clear Logs:
   Resets the log display area for a clean interface.
   ```javascript
   async function handleClearButton() {
     mt_UI.ClearLog();
     mt_UI.DeviceDisplay("");
   }
   ```

---

## License

```plaintext
Copyright 2020-2024 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.