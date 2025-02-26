# MagTek WebHID V5 Demo

## Overview

The MagTek WebHID V5 Demo provides a comprehensive interface to interact with MagTek's V5 EMV/NFC devices using WebHID and execute various commands for device configuration and transaction handling.

This application is built using HTML5, JavaScript, and Bootstrap, and demonstrates WebHID capabilities for controlling MagTek devices in a web environment.

Devices supported include:
- iDynamo 6
- eDynamo
- tDynamo
- mDynamo
---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [Commands](#commands)
- [Structure](#structure)
  - [HTML](#html)
  - [JavaScript Files](#javascript-files)
- [Usage](#usage)
- [License](#license)

---

## Features

- Establish WebHID connections with MagTek devices.
- Execute device-specific commands for EMV, NFC, and MSR operations.
- Display device status and transaction logs in real-time.
- Interactive command list for streamlined testing.
- Support for auto-starting operations upon device connection.

---

## Getting Started

### Prerequisites

- A modern browser supporting [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API).
- A MagTek WebHID-supported device.
- Internet connection to fetch Bootstrap dependencies.

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/magtek/webhid-v5-demo.git
   ```
2. Navigate to the project directory and open the `index.html` file in a supported browser.

---

## Commands

The command list includes pre-configured operations such as:
- GET KSN: Retrieve the Key Serial Number.
- START EMV: Start EMV operations.
- GET FIRMWARE: Retrieve firmware version.
- GET DEVICE INFO: Fetch detailed device information.

These commands are selectable from the dropdown menu and can also be modified using the input field for testing custom commands.

---

## Structure

### HTML

The main interface is defined in `index.html`:
- Header Section: Displays the MagTek logo and title.
- Device Display: Real-time status display for connected devices.
- Controls: Buttons for opening, closing, and clearing device connections.
- Command List: Pre-defined commands selectable from a dropdown.

### JavaScript Files

- `Demo_v5HID.js`: Core logic for WebHID interaction, sending commands, and processing responses.
- `site.css`: Custom styling for consistent UI presentation.

---

## Usage

1. Connect your MagTek device via USB.
2. Open the `index.html` file in your browser.
3. Click "Open" to establish a connection with the device.
4. Use the command dropdown or input box to send commands to the device.
5. View logs and status updates in the respective areas.

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```