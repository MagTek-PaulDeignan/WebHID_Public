# HID MQTT Device Client Documentation

## Overview

The HID MQTT Device Client is a web-based tool that enables interaction with MagTek devices over MQTT. It facilitates:
- Device connection via MQTT
- Command execution
- Real-time updates through a user interface
- Simplified device management

This documentation outlines the setup, core features, and usage instructions.

Devices supported via USB HID include:
- DynaFlex I
- DynFlex II
- DynaFlex II Go
- DynaFlex II PED
- DynaProx
---

## Table of Contents

- [Setup](#setup)
  - [Dependencies](#dependencies)
- [Initialization](#initialization)
- [Core Features](#core-features)
  - [Device Management](#device-management)
  - [Command Execution](#command-execution)
  - [Event Handling](#event-handling)
- [Usage Examples](#usage-examples)
- [License](#license)

---

## Setup

### Dependencies

1. Required Modules
   - `mt_Utils.js`: Utility functions for encoding, delays, and more.
   - `mt_UI.js`: Handles UI interactions.
   - `mt_MMSMQTT_API.js`: MQTT interface for device communication.

2. HTML Components
   - Buttons for device control (`Open`, `Close`).
   - Text area for logging and command input.
   - QR Code generation for device links.

3. External Libraries
   - [Bootstrap](https://getbootstrap.com/): For responsive UI components.

---

## Initialization

The application initializes when the DOM is fully loaded. It sets up the MQTT connection and configures device parameters.

### Key Configuration Variables

```javascript
let url = mt_Utils.getEncodedValue('MQTTURL', '<default-mqtt-url>');
let devPath = mt_Utils.getEncodedValue('MQTTDevice', '');
let userName = mt_Utils.getEncodedValue('MQTTUser', '<default-username>');
let password = mt_Utils.getEncodedValue('MQTTPassword', '<default-password>');
```

### DOM Initialization

Upon loading, the script logs the configured device and opens the MQTT connection.

```javascript
document.addEventListener("DOMContentLoaded", function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();
});
```

---

## Core Features

### Device Management

#### Open Device

Establishes an MQTT connection to the configured device.

```javascript
async function handleOpenButton() {
  mt_MMSMQTT_API.setURL(url);
  mt_MMSMQTT_API.setUserName(userName);
  mt_MMSMQTT_API.setPassword(password);
  mt_MMSMQTT_API.setPath(devPath);
  mt_MMSMQTT_API.OpenMQTT();
}
```

#### Close Device

Closes the active connection and clears logs.

```javascript
async function handleCloseButton() {
  await mt_MMSMQTT_API.CloseMQTT();
  mt_UI.ClearLog();
}
```

#### Clear Logs

Resets the logs and UI elements.

```javascript
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
}
```

---

### Command Execution

#### Execute Commands

The application supports pre-defined and custom MQTT commands.

```javascript
async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}
```

#### Command Parser

Handles command execution logic.

```javascript
async function parseCommand(message) {
  const cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "SENDCOMMAND":
      mt_MMSMQTT_API.SendCommand(cmd[1]);
      break;
    case "GETDEVICESN":
      const sn = await mt_MMSMQTT_API.GetDeviceSN();
      mt_UI.LogData(sn);
      break;
    default:
      mt_UI.LogData("Unknown Command");
  }
}
```

---

### Event Handling

#### Subscribed Events

1. Device Events
   - Tracks device connection status.

   ```javascript
   EventEmitter.on("OnDeviceConnect", (e) => {
     mt_UI.setUSBConnected("Connected");
   });
   ```

2. Transaction Events
   - Logs transaction completion.

   ```javascript
   EventEmitter.on("OnTransactionComplete", (e) => {
     mt_UI.LogData(`${e.Name}: ${e.Data}`);
   });
   ```

3. Error Handling
   - Captures and displays error information.

   ```javascript
   EventEmitter.on("OnError", (e) => {
     mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
   });
   ```

---

## Usage Examples

### Example: Start EMV Transaction

Use the pre-defined command to initiate an EMV transaction.

```plaintext
SENDCOMMAND,AA00810401001001842B100182013CA3098101018201018301018402000386159C01009F02060000000001009F0306000000000000
```

### Example: Retrieve Device Serial Number

Fetch and log the device serial number.

```javascript
parseCommand("GETDEVICESN");
```

---
## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```