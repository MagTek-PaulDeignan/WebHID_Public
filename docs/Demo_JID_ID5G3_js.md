# MagTek WebHID ID5G3 Command Interface Documentation

## Overview

This JavaScript module facilitates communication with MagTek ID5G3 devices using the WebHID API. It provides functionality for device management, sending commands, and processing responses. It also integrates a user-friendly interface for interaction.

Key Features:
- Device connection and disconnection management.
- Command execution and feedback logging.
- Support for parsing device responses and handling events.

Devices supported include:
- iDynamo 5 Gen III
---

## Table of Contents

- [Features](#features)
- [Command List](#command-list)
- [Event Handlers](#event-handlers)
- [Function Descriptions](#function-descriptions)
- [License](#license)

---

## Features

### Device Management
- Open Device: Connect to a MagTek ID5G3 device.
- Close Device: Disconnect from the device.
- Detect Device: Automatically detects connected devices.

### Command Execution
Send commands directly using an input box or select predefined commands from a dropdown menu.

### Real-Time Feedback
Log device responses, command results, and event data in the interface.

---

## Command List

| Command             | Description                       |
|---------------------|-----------------------------------|
| `GETAPPVERSION`     | Retrieve the application version. |
| `GETDEVINFO`        | Get device information.           |
| `SENDCOMMAND,<cmd>` | Send a command to the device.     |
| `GETDEVICELIST`     | List all connected devices.       |
| `OPENDEVICE`        | Open a connection to the device.  |
| `CLOSEDEVICE`       | Close the device connection.      |
| `WAIT,<ms>`         | Wait for a specified duration.    |
| `DISPLAYMESSAGE,<msg>` | Log a custom message to the UI.|
| `GETTAGVALUE,<tag>` | Retrieve a specific tag value.    |
| `PARSETLV,<tlv>`    | Parse TLV data and log results.   |
| `UPDATEPROGRESS`    | Update the progress bar UI.       |

---

## Event Handlers

### Key Event Handlers

1. Device Connection Events:
   Handles updates to the device's connection status.
   ```javascript
   const deviceConnectLogger = (e) => {
     mt_UI.setUSBConnected("Connected");
   };

   const deviceDisconnectLogger = (e) => {
     mt_UI.setUSBConnected("Disconnected");
   };
   ```

2. Command Execution Events:
   Logs responses from commands sent to the device.
   ```javascript
   const fromV5DeviceLogger = (e) => {
     mt_UI.LogData(`V5 Device Response: ${e.Data}`);
   };
   ```

3. Error Handling:
   Captures and logs errors.
   ```javascript
   const errorLogger = (e) => {
     mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
   };
   ```

4. MSR Swipe Events:
   Handles events when a card is swiped.
   ```javascript
   const V5MSRSwipeLogger = (e) => {
     mt_UI.LogData(`MSR Swiped ${e.Name}`);
     mt_UI.LogData(`${JSON.stringify(e.Data, null, 2)}`);
   };
   ```

---

## Function Descriptions

### Initialization
Initializes the UI and attaches event listeners for device interaction.
```javascript
document.addEventListener("DOMContentLoaded", handleDOMLoaded);
```

### Device Management
- handleOpenButton: Opens a connection to the device.
- handleCloseButton: Closes the device connection.
- handleClearButton: Clears the log and resets the interface.

### Command Parsing
Parses user input or predefined commands and executes them.
```javascript
async function parseCommand(message) {
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      return mt_AppSettings.App.Version;
    case "SENDCOMMAND":
      let Response = await mt_Device.sendCommand(cmd[1]);
      return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
    case "WAIT":
      mt_UI.LogData(`Waiting ${cmd[1]/1000} seconds...`);
      await mt_Utils.wait(cmd[1]);
      mt_UI.LogData(`Done Waiting`);
      break;
    default:
      mt_UI.LogData(`Unknown Parse Command: ${cmd[0]}`);
  }
}
```

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.