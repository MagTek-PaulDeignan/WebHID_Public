# MagTek WebSocket Config Documentation

## Overview

This HTML and JavaScript module provides an interface to configure MagTek WebSocket and trust options for devices. It enables users to manage device-specific settings such as network configurations, secure communication, and command-based interactions through a WebSocket-enabled framework.

Key Features:
- Configure WebSocket trust settings.
- Load device-specific TLS and non-TLS configurations.
- Manage device names, IP addresses, SSIDs, and passwords.
- Execute a variety of commands like starting EMV, NFC, and more.

---

## Table of Contents

- [Features](#features)
- [User Interface](#user-interface)
- [Command List](#command-list)
- [Core Functionalities](#core-functionalities)
- [Usage Example](#usage-example)
- [License](#license)

---

## Features

### Device Management
- Retrieve and set device properties, including:
  - Device name and IP.
  - SSID and passwords.
- Load TLS and non-TLS configurations for secure communication.

### Command Execution
- Execute a wide range of predefined commands such as:
  - Starting EMV, NFC, or MSR transactions.
  - Resetting the device.
  - User notifications and PIN entry requests.

### Interactive UI Elements
- Includes buttons, text fields, and checkboxes for streamlined interaction.
- Auto Start options for EMV, NFC, MSR, and more.

---

## User Interface

### Input Fields
- Device Name: Retrieve and display the device's name.
- Device IP: Retrieve and display the device's IP address.
- SSID: Get or set the device's SSID and password.

### Buttons
- Get Device Name/IP: Fetch the respective device details.
- Set SSID/Password: Save SSID and password configurations.
- Load TLS/No_TLS Configurations: Apply TLS settings for secure communication.
- Reset Device: Reset the connected device to its default state.
- Send Command: Execute a command entered in the command field.

### Dropdown
- A comprehensive list of predefined commands for specific operations.

---

## Command List

The following commands can be executed:

| Command                          | Description                            |
|----------------------------------|----------------------------------------|
| START EMV                    | Initiates EMV transaction.            |
| CANCEL EMV                   | Cancels an ongoing EMV transaction.   |
| Reset Device                 | Resets the device.                    |
| Get User Notify              | Retrieves user notification settings. |
| Set User Notify to All Events| Configures notifications for all events.|
| START CONTACT                | Initiates a contact transaction.      |
| START CONTACTLESS            | Initiates a contactless transaction.  |
| START MSR                    | Initiates MSR transaction.            |
| Get SN                       | Retrieves the serial number.          |
| Get Capabilities             | Fetches device capabilities.          |

---

## Core Functionalities

### Device Properties
- Device Name: Retrieve or update the device name.
- Device IP: Fetch the current IP address of the device.

### TLS Configuration
- Load TLS or non-TLS trust configurations using dedicated buttons.

### Command Execution
- Execute commands through the "Send Command" button or select from the dropdown.

### Event Management
- Uses interactive checkboxes for auto-start options:
  - EMV
  - NFC
  - MSR
  - Touch (hidden by default)

---

## Usage Example

1. Load the HTML in a browser with access to a MagTek-compatible device.
2. Use the "Open" button to establish a connection.
3. Select a command from the dropdown or input a custom command in the command field.
4. Click the "Send Command" button to execute.

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.