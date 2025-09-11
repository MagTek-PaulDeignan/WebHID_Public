# MagTek MQTT MMS API Documentation

## Overview
The MagTek MQTT MMS API facilitates the management and interaction with MagTek devices using MQTT communication. This system includes:
- Device connection management
- Command execution
- Event-driven architecture for real-time interactions

This documentation outlines the key components, functionalities, and usage guidelines.

---

## Table of Contents

- [Setup](#setup)
  - [Dependencies](#dependencies)
- [Initialization](#initialization)
- [Core Functionalities](#core-functionalities)
  - [Device Management](#device-management)
  - [Command Execution](#command-execution)
  - [Event Handling](#event-handling)
- [Usage Examples](#usage-examples)
- [License](#license)

---

## Setup

### Dependencies

1. **JavaScript Modules**:
   - `mt_Utils.js`: Utility functions for encoding, delays, and tag value parsing.
   - `mt_UI.js`: Handles UI updates such as logs and display messages.
   
   - `API_rms.js`: Manages RMS API interactions.
   

2. **External Libraries**:
   - [EventEmitter](https://nodejs.org/api/events.html): For managing custom events.

3. **HTML Elements**:
   - Buttons, text inputs, and dropdowns for user interaction.

---

## Initialization

The script initializes by retrieving encoded configuration values and setting up event listeners for user interactions and device events.

### Key Configuration Variables

- **MQTT URL**: Base URL for MQTT communication.
- **Device Path**: Path to the MQTT device.
- **Username and Password**: For secure MQTT connection.

```javascript
let url = mt_Utils.getEncodedValue('MQTTURL', '<default-value>');
let devPath = mt_Utils.getEncodedValue('MQTTDevice', '');
let userName = mt_Utils.getEncodedValue('MQTTUser', '<default-value>');
let password = mt_Utils.getEncodedValue('MQTTPassword', '<default-value>');
```

### DOMContentLoaded

On DOM load, the script logs the configured device and attempts to open the connection:

```javascript
document.addEventListener("DOMContentLoaded", async function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();
});
```

---

## Core Functionalities

### Device Management

#### Open Device
Initializes an MQTT connection with the configured device.

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
Closes the active MQTT connection and clears the log.

```javascript
async function handleCloseButton() {
  await mt_MMSMQTT_API.CloseMQTT();
  mt_UI.ClearLog();
}
```

#### Clear Logs
Resets the display and clears the input fields.

```javascript
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
}
```

---

### Command Execution

#### Send Command
Processes user-input commands or pre-defined dropdown options.

```javascript
async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}
```

#### Command Parsing
Defines actions for supported command types such as `SENDCOMMAND`, `GETDEVICESN`, and `UPDATEDEVICE`.

```javascript
async function parseCommand(message) {
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "SENDCOMMAND":
      mt_MMSMQTT_API.SendCommand(cmd[1]);
      break;
    case "GETDEVICESN":
      let sn = await mt_MMSMQTT_API.GetDeviceSN();
      mt_UI.LogData(sn);
      break;
    default:
      mt_UI.LogData("Unknown Command");
  }
}
```

---

### Event Handling

The system uses an event-driven architecture to respond to device actions and statuses.

#### Subscribed Events

- **Device Connection Events**:
  - `OnDeviceConnect` updates the UI when a device connects.

  ```javascript
  EventEmitter.on("OnDeviceConnect", (e) => {
    mt_UI.setUSBConnected("Connected");
  });
  ```

- **Transaction Events**:
  - `OnTransactionComplete` logs the completion details.

  ```javascript
  EventEmitter.on("OnTransactionComplete", (e) => {
    mt_UI.LogData(`${e.Name}: ${e.Data}`);
  });
  ```

- **Error Handling**:
  Captures errors and logs them for debugging purposes.

  ```javascript
  EventEmitter.on("OnError", (e) => {
    mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
  });
  ```

---

## Usage Examples

### Start EMV Command
Sends a pre-defined command to initiate an EMV transaction.

```javascript
SENDCOMMAND,AA008104010010018430100182013CA30981010182010183010184020003861A9C01009F02060000000001009F03060000000000005F2A020840
```

### Retrieve Device Serial Number
Fetches and logs the serial number of the connected device.

```javascript
parseCommand("GETDEVICESN");
```

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```