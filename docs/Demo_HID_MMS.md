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
- [License](#license)

---

## Overview

The MagTek HID MMS Demo provides an interactive interface for testing and interacting with MagTek HID devices that implement MagTek Messaging Schema (MMS) system architecture.  This demo includes functionality for device connection, command execution, and USB status monitoring.

Devices supported include:
- DynaFlex I
- DynFlex II
- DynaFlex II Go
- DynaFlex II PED
- DynaProx
---

## Modules and Dependencies

### CSS and JavaScript Resources

1. Bootstrap CSS:
   - URL: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`
   - Provides responsive design and UI components.

2. Site-specific CSS:
   - File: `./css/site.css`
   - Custom styling for the demo interface.

3. JavaScript Module:
   - File: `./js/Demo_mmsHID.js`
   - Contains the core functionality for device interaction and command execution.

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
  <option value="SENDCOMMAND,AA00810401001001842B100182013CA3098101018201018301018402000386159C01009F02060000000001009F0306000000000000">START EMV</option>
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

The JavaScript file `Demo_mmsHID.js` contains the logic for:

- Handling button click events.
- Managing the device connection lifecycle.
- Sending commands to the HID device and processing responses.
- Updating the USB connection status dynamically.

### Example Functions

#### Open Device
```javascript
function openDevice() {
  // Logic to establish connection with the HID device
}
```

#### Send Command
```javascript
function sendCommand(command) {
  // Logic to send a command to the device
}
```

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
