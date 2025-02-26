# MagTek Configuration Script Documentation

## Overview

This JavaScript module is designed to handle the configuration of MagTek services and devices via an interactive HTML interface. It facilitates loading, saving, and managing settings like API keys, MQTT details, and contactless options.

Key Features:
- Dynamic Loading of Configuration Data: Automatically populates fields with saved settings on page load.
- Interactive UI Handlers: Listens for user interactions such as saving settings or navigating back.
- Encoded Value Management: Encodes and decodes sensitive data for secure storage and display.

---

## Table of Contents

- [Features](#features)
- [Core Functions](#core-functions)
- [Event Listeners](#event-listeners)
- [Usage Example](#usage-example)
- [License](#license)

---

## Features

### Configuration Management
- Supports loading and saving the following settings:
  - RMS API Key
  - Profile Name
  - Base URL
  - RMS Version
  - WebSocket Address
  - MQTT Details (URL, Device, User, Password)
  - Contactless Communication Delay
  - Show Offline Devices Toggle

### Security
- Encodes sensitive information such as API keys and passwords before saving them.

### User-Friendly Interface
- Provides feedback after saving configurations.
- Redirects users to the main menu after saving or canceling changes.

---

## Core Functions

### `handleDOMLoaded`
Executed when the DOM is fully loaded. This function:
1. Retrieves saved configuration values using `mt_Utils.getEncodedValue`.
2. Populates corresponding input fields in the HTML form.
3. Sets the state of the `Show Offline Devices` checkbox.

Snippet:
```javascript
async function handleDOMLoaded() {
  let item = document.getElementById("txAPIKey");
  item.value = mt_Utils.getEncodedValue("APIKey", "");
  // (similar for other fields)
}
```

### `handleBackButton`
Navigates the user back to the main menu when the "Back" button is clicked.

Snippet:
```javascript
async function handleBackButton() {
  window.location.href = "index.html";  
}
```

### `handleSaveButton`
Saves the user-inputted configuration data:
1. Reads values from the input fields.
2. Encodes and stores values using `mt_Utils.saveEncodedValue`.
3. Provides a confirmation message and redirects the user to the main menu.

Snippet:
```javascript
async function handleSaveButton() {
  let item = document.getElementById("txAPIKey");  
  mt_Utils.saveEncodedValue("APIKey", item.value);
  // (similar for other fields)
  item.innerText = " : Saved";  
  window.location.href = "index.html";
}
```

---

## Event Listeners

### DOMContentLoaded
- Trigger: Fired when the page is fully loaded.
- Handler: `handleDOMLoaded`

### Save Button
- Trigger: Click event on the "Save" button.
- Handler: `handleSaveButton`

### Back Button
- Trigger: Click event on the "Back" button.
- Handler: `handleBackButton`

---

## Usage Example

### Initialization
This script should be included in an HTML file with corresponding input fields for settings. Example:
```html
<input class="form-control" id="txAPIKey" type="password" value="">
<button id="btnSave">Save</button>
<button id="btnBack">Back</button>
<script src="./path/to/script.js"></script>
```

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.