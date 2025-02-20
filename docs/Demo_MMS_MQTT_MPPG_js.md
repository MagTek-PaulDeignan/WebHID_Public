# MagTek MQTT MMS Script Documentation

## Overview

This script enables interaction with MagTek devices through MQTT and APIs for sales processing and device management. Core functionalities include:

- Device connection management
- Command execution
- Event-driven architecture for real-time interactions
- Qwantum Multi-Factor Authentication (QMFA) integration

Devices supported via USB HID include:
- DynaFlex I
- DynFlex II
- DynaFlex II Go
- DynaFlex II PED *
- DynaProx

* (DynaFlex II PED can be used via MQTT)
---

## Table of Contents

- [Setup](#setup)
  - [Dependencies](#dependencies)
- [Features](#features)
  - [Device Management](#device-management)
  - [Sales Processing](#sales-processing)
  - [Event Logging](#event-logging)
- [Core Functions](#core-functions)
- [Usage Guide](#usage-guide)
- [License](#license)

---

## Setup

### Dependencies

1. JavaScript Modules:
   - `mt_Utils.js`: Utility functions for encoding, delays, and tag value parsing.
   - `mt_MQTT.js`: Handles MQTT communication for device commands.
   - `mt_UI.js`: Manages UI updates like logs and display messages.
   - `mt_MPPG.js`: Processes payment transactions via Magensa.
   - `qMFAAPI.js`: Facilitates QMFA-related interactions.

2. HTML Elements:
   - Buttons, text inputs, and checkboxes for user interaction.

---

## Features

### Device Management

- Open Device: Establishes an MQTT connection with a MagTek device.
- Close Device: Ends the connection and clears the session data.
- Auto Start: Configures default technologies (EMV, NFC, MSR).

### Sales Processing

- Inputs:
  - `Sale Amount`: Amount for the sale.
  - `Tax`: Optional tax.
  - `Tip`: Optional tip.
  - `Email` and `SMS`: For receipt delivery.

- QMFA Integration:
  - Enhanced security with Qwantum Multi-Factor Authentication.

- Process Sale:
  - Initiates the payment flow.
  - Supports ARQC (Authorization Request Cryptogram).

### Event Logging

- Real-time logging of actions and responses.
- Barcode and token handling for QMFA transactions.

---

## Core Functions

### Initialization

- Retrieves encoded configuration values.
- Sets up DOM event listeners for UI elements.

```javascript
async function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();

  mt_MPPG.setUsername(mt_Utils.getEncodedValue("MPPG_UserName", "<encoded>"));
  mt_MPPG.setPassword(mt_Utils.getEncodedValue("MPPG_Password", "<encoded>"));
  mt_MPPG.setCustCode(mt_Utils.getEncodedValue("MPPG_CustCode", "<encoded>"));
  mt_MPPG.setProcessorName(mt_Utils.getEncodedValue("MPPG_ProcessorName", "<encoded>"));
  mt_UI.LogData(`Configured to use: ${mt_MPPG.ProcessorName}`);
}
```

### Sales Processing

- Process Sale:
  - Verifies inputs and initiates the transaction.
  - Supports QMFA if enabled.

```javascript
async function handleProcessSale() {
  let QMFAChecked = document.getElementById("chk-UseQMFA").checked;
  let amt = document.getElementById("saleAmount").value;

  if (amt.length > 0 && confirm("Ready To Process Sale?")) {
    let Amount = {
      SubTotal: parseFloat(amt),
      Tax: parseFloat(document.getElementById("saleTax").value || 0),
      Tip: parseFloat(document.getElementById("saleTip").value || 0),
      CashBack: 0
    };

    let saleResp = await mt_MPPG.ProcessSale(Amount, email, sms, 6, window.mt_device_ARQCData);
    if (saleResp.Details.status === "PASS") {
      // Handle success
    }
  } else {
    mt_UI.LogData("No Amount Entered");
  }
}
```

### Event Handling

- Logs key events such as device connection, errors, and transaction completion.

```javascript
EventEmitter.on("OnDeviceConnect", (e) => mt_UI.setUSBConnected("Connected"));
EventEmitter.on("OnError", (e) => mt_UI.LogData(`Error: ${e.Source} ${e.Data}`));
EventEmitter.on("OnTransactionComplete", trxCompleteLogger);
```

---

## Usage Guide

### Steps to Process a Sale

1. Open Device:
   - Click "Open" to establish a connection.
2. Enter Sale Details:
   - Fill out the `Sale Amount`, `Tax`, and `Tip` fields.
   - Optionally, provide `Email` or `SMS` for receipts.
3. Enable QMFA:
   - Check "Use QMFA" for multi-factor authentication.
4. Initiate Sale:
   - Click "Process Sale".
5. View Logs:
   - Monitor real-time logs in the `LogData` section.

---

## License

```plaintext
Copyright 2020-2025 MagTek, Inc., Paul Deignan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```