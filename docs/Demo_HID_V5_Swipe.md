# MagTek WebHID V5 Devices for MSR/Manual Entry Demo

## Overview

This HTML page and its associated JavaScript provide an interactive interface for communicating with MagTek Dynamag devices using the WebHID API. It offers features such as device connection, command sending, and firmware updates, with a focus on a user-friendly UI for developers and testers.

Key Features:
- Device communication via WebHID.
- Command execution for device interaction.
- User-friendly logging and display interface.
- Compatibility with MagTek's RMS for device updates.

Devices supported include:
- Dynamag
- DynaPAD
- MagneSafe Swipe Readers
- MagTek SureSwipe Readers
- MagTek Non Encrypting MSRs
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

- Device Status and Display:
  Displays device connection status and messages.
  ```html
  <div id="DeviceDisplay">WELCOME</div>
  <textarea class="form-control" name="LogData" id="LogData" rows="12"></textarea>
  <div class="form-group container-left">
    <img id="USBStatus" src="./images/usb-disconnected.png"><span id="lblUSBStatus">Disconnected</span>
  </div>
  ```

- Control Buttons:
  Buttons for opening/closing the device, clearing logs, and sending commands.
  ```html
  <button class="btn btn-primary" id="deviceOpen">Open</button>
  <button class="btn btn-primary" id="deviceClose">Close</button>
  <button class="btn btn-primary" id="clearCommand">Clear</button>
  ```

- Command Input and Dropdown:
  Fields for entering and selecting commands to send to the device.
  ```html
  <input type="text" class="form-control" name="sendData" id="sendData" value="SENDCOMMAND,0900">
  <button class="btn btn-primary" id="sendCommand">Send Command</button>
  <select class="form-control-3" name="CommandList" id="CommandList">
    <option value="SENDCOMMAND,0900">GET KSN</option>
    <option value="SENDCOMMAND,000100">GET FIRMWARE</option>
    <option value="SENDCOMMAND,000103">GET SN</option>
    <option value="UPDATEDEVICE">RMS Update Device</option>
  </select>
  ```

---

## Features

### Device Connection
- Open Device: Establishes communication with the connected device.
  ```html
  <button class="btn btn-primary" id="deviceOpen">Open</button>
  ```

- Close Device: Terminates communication with the device.
  ```html
  <button class="btn btn-primary" id="deviceClose">Close</button>
  ```

### Command Execution
Allows sending commands directly or selecting predefined commands from the dropdown menu.

### Logging and Feedback
Logs are displayed in a textarea element, providing real-time feedback on actions and events.

---

## Command List

| Command             | Description                       |
|----------------------|-----------------------------------|
| `SENDCOMMAND,0900`   | Retrieves the KSN.               |
| `SENDCOMMAND,000100` | Retrieves the firmware version.  |
| `SENDCOMMAND,000103` | Retrieves the serial number.     |
| `UPDATEDEVICE`       | Initiates an RMS device update.  |

---

## Event Handlers

### Key Event Handlers
1. Device Connection:
   Updates the UI when the device is connected or disconnected.
   ```javascript
   const deviceConnectLogger = (e) => {
     mt_UI.setUSBConnected("Connected");
   };
   const deviceDisconnectLogger = (e) => {
     mt_UI.setUSBConnected("Disconnected");
   };
   ```

2. Command Execution:
   Handles sending commands to the device.
   ```javascript
   async function handleSendCommandButton() {
     const data = document.getElementById("sendData");
     await parseCommand(data.value);
   }
   ```

3. Clear Logs:
   Clears all logs and resets the UI.
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