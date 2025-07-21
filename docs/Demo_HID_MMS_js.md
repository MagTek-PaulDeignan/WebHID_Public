# MagTek HID MMS Demo Documentation

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
  - [Event Listeners](#event-listeners)
  - [Command Parsing](#command-parsing)
- [License](#license)

---

## Overview

The MagTek HID MMS Demo provides an interactive interface for testing and interacting with MagTek HID devices. It includes functionality for device connection, command execution, USB status monitoring, and advanced event handling.

Devices supported include:
- DynaFlex I
- DynFlex II
- DynaFlex II Go
- DynaFlex II PED
- DynaProx
---

## Modules and Dependencies

### JavaScript Modules

1. mt_Utils:
   - File: `./mt_utils.js`
   - Utility functions for processing commands, delays, and TLV parsing.

2. mt_MMS:
   
   - API for interacting with HID devices, including sending commands and retrieving device information.

3. mt_UI:
   - File: `./mt_ui.js`
   - Handles UI updates, logging, and status display.


4. mt_RMS_API:
   - File: `./API_rms.js`
   - API for RMS configuration and communication.

5. Event Management:
   - File: `./mt_events.js`
   - Adds event emitter functionality for device interactions and logging.

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
  <h1>HID MMS Demo</h1>
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
  <option value="SENDCOMMAND,AA008104010010018430100182013CA30981010182010183010184020003861A9C01009F02060000000001009F03060000000000005F2A020840">START EMV</option>
  <!-- Additional options here -->
</select>
```

---

## Key Functionalities

### USB Connection Status

Displays the real-time status of the USB connection using an image and label. The status updates dynamically based on the device state.

### Device Controls

- Open: Initiates the connection to the HID device.
- Close: Terminates the connection.
- Clear: Clears the logs and input fields.

### Command Data Input and Processing

Users can input custom commands into the `sendData` field and execute them using the "Send Command" button. The results appear in the log section.

### Command List Dropdown

Provides pre-defined commands for common device operations such as starting EMV, canceling EMV, and resetting the device.

---

## JavaScript Implementation

### Event Listeners

Event listeners are added to handle user interactions and device events:

```javascript
document.querySelector("#deviceOpen").addEventListener("click", handleOpenButton);
document.querySelector("#deviceClose").addEventListener("click", handleCloseButton);
document.querySelector("#sendCommand").addEventListener("click", handleSendCommandButton);
document.querySelector("#clearCommand").addEventListener("click", handleClearButton);
document.querySelector("#CommandList").addEventListener("change", mt_UI.FromListToText);
document.addEventListener("DOMContentLoaded", handleDOMLoaded);
document.getElementById("fileInput").addEventListener("change", handleFileUpload);
```

### Command Parsing

Commands entered by the user are processed through the `parseCommand` function, which supports multiple operations:

#### Example Operations

- Send Command:
  ```javascript
  case "SENDCOMMAND":
    Response = await mt_MMS.sendCommand(cmd[1]);
    mt_UI.LogData(Response.HexString);
    break;
  ```

- Get Device Serial Number:
  ```javascript
  case "GETDEVICESN":
    let sn = await mt_MMS.GetDeviceSN();
    mt_UI.LogData(sn);
    break;
  ```

- Update Device Firmware:
  ```javascript
  case "UPDATEDEVICE":
    await mt_RMS.updateDevice();
    break;
  ```

- Parse TLV Data:
  ```javascript
  case "PARSETLV":
    retval = mt_Utils.tlvParser(cmd[1]);
    mt_UI.LogData(JSON.stringify(retval));
    break;
  ```

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```