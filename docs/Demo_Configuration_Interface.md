# MagTek Configuration Interface Documentation

## Overview

This HTML document provides a configuration interface for MagTek applications. It enables users to set up essential parameters such as RMS options, WebSocket options, MQTT options, and other settings required for device and service communication.

Key Features:
- RMS Options: Configure the Remote Management System (RMS).
- WebSocket Options: Set WebSocket addresses.
- MQTT Options: Configure MQTT connectivity, including user credentials.
- Contactless Options: Adjust settings for contactless operations.

---

## Table of Contents

- [Features](#features)
- [Structure Overview](#structure-overview)
- [Key Configuration Fields](#key-configuration-fields)
- [Event Handlers and Buttons](#event-handlers-and-buttons)
- [License](#license)

---

## Features

### Modular Configuration
This page is divided into distinct sections for different settings:
1. RMS Options: Parameters for Remote Management System connectivity.
2. WebSocket Options: Configure WebSocket addresses for communication.
3. MQTT Options: MQTT broker details, including address, device, and user credentials.
4. Contactless Options: Adjustable delays for contactless communication.

### Interactive Input
- Text input fields for addresses, keys, and delays.
- Password fields for sensitive data, such as API and MQTT credentials.
- Checkboxes for optional features like showing offline devices.

### Save and Navigation
Includes buttons to save configuration settings or navigate back.

---

## Structure Overview

### Header Section
```html
<title>MagTek Configure</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=yes">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="./css/site.css"/>
<script type="module" src="./js/configure.js"></script>
```
- Bootstrap: For responsive layout and styling.
- CSS: Custom styles defined in `site.css`.
- JavaScript Module: The core functionality implemented in `configure.js`.

---

## Key Configuration Fields

### RMS Options
- Profile Name: Specify the profile name for RMS.
- API Key: Secure access to the RMS.
- URL: Endpoint URL for RMS connectivity.
- Version: Specify the RMS version.

```html
<label for="txProfileName">Profile Name</label>
<input class="form-control" id="txProfileName" type="text" value="">
<label for="txAPIKey">APIKey</label>
<input class="form-control" id="txAPIKey" type="password" value="">
```

### WebSocket Options
- WebSocket Address: Endpoint for WebSocket communication.

```html
<label for="txWSAddress">WebSocket Address</label>
<input class="form-control" id="txWSAddress" type="text" value="">
```

### MQTT Options
- MQTT Address: Specify the broker address.
- MQTT Device: Unique device identifier.
- MQTT User: Username for authentication.
- MQTT Password: Password for authentication.

```html
<label for="txMQTTURL">MQTT Address</label>
<input class="form-control" id="txMQTTURL" type="text" value="">
<label for="txMQTTDevice">MQTT Device</label>
<input class="form-control" id="txMQTTDevice" type="text" value="">
<label for="txMQTTUser">MQTT User</label>
<input class="form-control" id="txMQTTUser" type="text" value="">
<label for="txMQTTPassword">MQTT Password</label>
<input class="form-control" id="txMQTTPassword" type="password" value="">
```

### Contactless Options
- Contactless Delay: Adjust the delay in contactless communication.

```html
<label for="txContactlessDelay">Contactless Delay</label>
<input class="form-control" id="txContactlessDelay" type="text" value="">
```

---

## Event Handlers and Buttons

### Buttons
1. Back: Navigate to the previous screen.
2. Save: Save the configuration settings.

```html
<button class="btn btn-primary" id="btnBack">Back</button>
<button class="btn btn-primary" id="btnSave">Save</button><span id="status"></span>
```

### JavaScript Integration
The `configure.js` module handles input validation, data persistence, and communication with backend services.

---

## License

```plaintext
Copyright 2020-2024 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.