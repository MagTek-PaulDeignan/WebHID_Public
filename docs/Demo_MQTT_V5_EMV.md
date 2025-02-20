# MagTek MQTT V5 Demo Documentation

## Overview

This HTML template is designed for interfacing with MagTek devices using MQTT protocols. The demo showcases command execution, device interactions, and status monitoring via a clean, responsive UI.

Key Features:
- Web-based interface for device interaction.
- Command sending and status display.
- Compatibility with various MagTek device modes (EMV, NFC, MSR).

Devices supported include *:
- iDynamo 6
- eDynamo
- tDynamo
- mDynamo

(*V5 EMV/NFC devices require the V5 EMV MQTT Device Client)

---

## Table of Contents

- [UI Components](#ui-components)
- [Key Functionalities](#key-functionalities)
- [Command List](#command-list)
- [File Upload](#file-upload)
- [Dependencies](#dependencies)
- [License](#license)

---

## UI Components

### Header Section
Displays the MagTek logo and title:
```html
<div class="container">
  <a href="index.html">
    <img src="./images/magtek_logo.png" alt="Logo" width="150">
  </a>
</div>
<div class="container">
  <h1>MQTT V5 Demo</h1>
</div>
```

### Device Display
Shows the current device status:
```html
<div class="container">
  <div id="DeviceDisplay">WELCOME</div>
  <textarea class="form-control" name="LogData" id="LogData" rows="12"></textarea>
</div>
```

### Device Connection Status
Indicates USB connection status with visual and textual feedback:
```html
<div class="form-group container-left">
  <img id="USBStatus" src="./images/usb-disconnected.png"><span id="lblUSBStatus">Disconnected</span>
</div>
```

### Controls
#### Buttons
- Open: Opens a connection to the device.
- Close: Closes the connection.
- Clear: Clears the log and resets the UI.

#### Auto Start Options
Allows configuration of automatic transaction initiation:
```html
<div class="form-group" id="autoStartOptions">
  <input type="checkbox" id="chk-AutoStart" name="AutoStart" value=""><label for="chk-AutoStart">Auto Start</label>
  <input type="checkbox" id="chk-AutoEMV" name="AutoEMV" value=""><label for="chk-AutoEMV">EMV</label>
  <input type="checkbox" id="chk-AutoNFC" name="AutoNFC" value=""><label for="chk-AutoNFC">NFC</label>
  <input type="checkbox" id="chk-AutoMSR" name="AutoMSR" value=""><label for="chk-AutoMSR">MSR</label>
</div>
```

---

## Key Functionalities

### Command Execution
Supports sending commands to the connected device:
```html
<label for="sendData">Command Data</label>
<input type="text" class="form-control" name="sendData" id="sendData" aria-describedby="helpId" value="SENDCOMMAND,0900">
<button class="btn btn-primary" id="sendCommand">Send Command</button>
```

### Command Selection
Provides a dropdown list of pre-defined commands:
```html
<select class="form-control-3" name="CommandList" id="CommandList">
  <option value="SENDCOMMAND,0900">GET KSN</option>
  <option value="SENDCOMMAND,491900000300001300078000000000100000000000000000084001">START 3 - No Timeout</option>
  <option value="SENDCOMMAND,000100">GET FIRMWARE</option>
  <!-- Additional options omitted for brevity -->
</select>
```

---

## Command List

The following commands are available in the dropdown menu:

| Command                                | Description                                |
|----------------------------------------|--------------------------------------------|
| `SENDCOMMAND,0900`                     | Get KSN                                    |
| `SENDCOMMAND,491900000300001300078000` | Start 3 - No Timeout                      |
| `SENDCOMMAND,000100`                   | Get Firmware Version                      |
| `SENDCOMMAND,4800`                     | Get Output Channel                        |
| `SENDCOMMAND,480100`                   | Set USB Output Channel                    |
| `SENDCOMMAND,49190000030000131E028000` | Start EMV                                 |
| `SENDCOMMAND,491900000300001300048000` | Start Contactless EMV                     |
| `SENDCOMMAND,49190000030000131E068000` | Start Both EMV                            |
| `SENDEXTENDEDCOMMAND,0501,00`          | Get SPI Status                            |
| `UPDATEDEVICE`                         | Update Device Firmware via RMS            |

---

## File Upload

Allows users to upload configuration or command files:
```html
<div class="container">
  <input class="btn btn-primary" id="fileInput" type="file">
</div>
```

---

## Dependencies

### External Libraries
- Bootstrap CSS: Provides responsive design and UI styling.
  ```html
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  ```

### Scripts
- Demo_v5MQTT.js: Contains the logic for MQTT-based device interaction.
  ```html
  <script type="module" src="./js/Demo_v5MQTT.js"></script>
  ```

- site.css: Provides custom styles for the demo UI.
  ```html
  <link rel="stylesheet" type="text/css" href="./css/site.css"/>
  ```

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.