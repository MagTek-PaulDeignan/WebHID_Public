# MagTek V5 HID Interaction Script Documentation

## Overview

This Javascript provides the functionality to manage and interact with MagTek V5 EMV/NFC HID devices. It includes WebHID operations, device initialization, command execution, event handling, and integration with related APIs.

The script supports:
- Sending and processing commands to MagTek devices.
- Device status logging and user notifications.
- Integration with APIs for RMS and extended device management.

Devices supported include:
- iDynamo 6
- eDynamo
- tDynamo
- mDynamo
---

## Table of Contents

- [Initialization](#initialization)
- [Key Functions](#key-functions)
- [Commands](#commands)
- [Event Handling](#event-handling)
- [Dependencies](#dependencies)
- [License](#license)

---

## Initialization

The script initializes the following components:
- Event Listeners: Binds UI elements (buttons, input fields) to corresponding functions.
- HID Device Handlers: Detects device connections and disconnections.
- RMS Configuration: Sets default RMS API parameters (`URL`, `APIKey`, `ProfileName`).

### DOMContentLoaded Event
This event initializes the script when the page loads:
```javascript
document.addEventListener("DOMContentLoaded", handleDOMLoaded);
```

`handleDOMLoaded`:
- Clears logs.
- Fetches a list of connected devices.
- Sets up HID connection listeners.

---

## Key Functions

### Device Management

#### `handleOpenButton`
- Opens a HID connection to the device.
- Sets the device date and USB output channel.

#### `handleCloseButton`
- Closes the HID connection and clears logs.

#### `handleClearButton`
- Clears the log data and resets the device display.

### Command Execution

#### `parseCommand(message)`
- Processes commands based on the specified action.
- Supports actions like `GETAPPVERSION`, `SENDCOMMAND`, `SENDEXTENDEDCOMMAND`, `GETDEVICELIST`, etc.

Example for sending a command:
```javascript
case "SENDCOMMAND":
  Response = await mt_Device.sendCommand(cmd[1]);
  return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
```

### Utility Functions

#### `ClearAutoCheck`
- Unchecks the auto-start checkbox for transactions.

#### `EmitObject`
- Emits an event with a specified name and data object.

---

## Commands

The script supports the following commands via the `parseCommand` function:

| Command                | Description                                  |
|------------------------|----------------------------------------------|
| `GETAPPVERSION`        | Retrieves the application version.          |
| `SENDCOMMAND,<cmd>`    | Sends a standard command to the device.      |
| `SENDEXTENDEDCOMMAND`  | Sends an extended command.                  |
| `GETDEVICELIST`        | Retrieves the list of connected devices.     |
| `OPENDEVICE`           | Opens a connection to the device.           |
| `CLOSEDEVICE`          | Closes the connection to the device.        |
| `DISPLAYMESSAGE,<msg>` | Logs a message to the UI.                   |
| `UPDATEDEVICE`         | Updates the device firmware via RMS.        |

---

## Event Handling

The script listens for various device and system events using the `EventEmitter` object.

### Device Events

| Event                   | Handler Function           | Description                           |
|-------------------------|----------------------------|---------------------------------------|
| `OnDeviceConnect`       | `deviceConnectLogger`      | Logs when a device is connected.      |
| `OnDeviceDisconnect`    | `deviceDisconnectLogger`   | Logs when a device is disconnected.   |
| `OnDeviceOpen`          | `deviceOpenLogger`         | Logs when a device is opened.         |
| `OnDeviceClose`         | `deviceCloseLogger`        | Logs when a device is closed.         |

### Transaction Events

| Event                   | Handler Function           | Description                           |
|-------------------------|----------------------------|---------------------------------------|
| `OnTransactionComplete` | `trxCompleteLogger`        | Logs transaction completion.          |
| `OnARQCData`            | `arqcLogger`              | Logs ARQC data from transactions.     |

### Custom Events

| Event                   | Handler Function           | Description                           |
|-------------------------|----------------------------|---------------------------------------|
| `OnBarcodeDetected`     | `barcodeLogger`           | Logs barcode data from the device.    |
| `OnUserSelection`       | `displayUserSelectionLogger` | Logs user selection events.          |

---

## Dependencies

### Internal Modules
- `mt_Utils`: Utilities for encoding, decoding, and general helpers.
- `mt_Device`: Core device communication and WebHID functionality.
- `mt_RMS`: Handles RMS-specific operations for firmware updates.
- `mt_UI`: Manages user interface interactions.
- `mt_events`: Event emitter for handling asynchronous events.

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```