# MagTek MQTT MMS Demo Documentation

## Overview
The MagTek MQTT MMS Demo provides a web-based interface to interact with Magensa-connected devices. Users can perform payment-related actions, configure device settings, and process sales with integrated QMFA (Qwantum Multi-Factor Authentication) features. This documentation outlines the core functionalities of the demo application.

---

## Table of Contents

- [Setup](#setup)
  - [Dependencies](#dependencies)
- [Features](#features)
  - [Device Connection](#device-connection)
  - [Sales Processing](#sales-processing)
  - [Configuration Options](#configuration-options)
- [Usage Guide](#usage-guide)
- [License](#license)

---

## Setup

### Dependencies

1. HTML Components:
   - Uses Bootstrap 5 for styling and layout.
   - Includes custom CSS for additional styles (`site.css`).

2. JavaScript Modules:
   - `mmsMPPG.js`: Handles interactions with Magensa APIs for payment processing.

3. External Resources:
   - [Bootstrap 5.3.3](https://getbootstrap.com): For responsive design and UI components.

---

## Features

### Device Connection

- Displays the connection status of the MagTek device.
- Ensures only one active instance of the page to avoid conflicts.
- Allows users to establish and close a connection to a device.

### Sales Processing

Users can input payment details and process sales transactions.

#### Input Fields:
- Sale Amount: Total amount for the sale.
- Tax: Applicable tax for the transaction.
- Tip: Optional tip amount.
- Email: Email address for receipt delivery.
- SMS: Mobile number for SMS receipts.

#### Additional Features:
- Use QMFA: Optional toggle to enable Qwantum Multi-Factor Authentication for enhanced security.
- Process Sale: Button to initiate the payment process.

### Configuration Options

- Auto Start Options: Hidden options for configuring EMV, NFC, MSR, and Touch auto-start functionality.
- Device-Specific Links:
  - Configure MPPG (Magensa Payment Protection Gateway).
  - Lookup QMFA authentication tokens.

---

## Usage Guide

### Steps to Process a Sale

1. Enter Sale Details:
   - Fill in the required fields (Sale Amount, Tax, Tip).
   - Optionally provide an email or SMS for the receipt.

2. Enable QMFA (if needed):
   - Check the "Use QMFA" box to add an additional layer of security.

3. Process the Sale:
   - Click the "Process Sale" button to initiate the transaction.
   - View transaction logs and statuses in the log area.

### Configuration and Links

- Configure MPPG: Navigate to the `configure_mppg.html` page to set up the Magensa Payment Protection Gateway.
- Lookup Auth Token: Use `qmfaauth.html` for QMFA token retrieval.

### Viewing Logs

- The "Log Data" area displays real-time logs of actions and device statuses.
- Check connection status via the USB status indicator.

---

## License
```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
