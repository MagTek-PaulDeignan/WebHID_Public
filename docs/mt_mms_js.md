This JavaScript module is designed to facilitate communication and data exchange with MagTek’s MMS (MagTek Messaging Service) devices via the WebHID API. It leverages various imported modules and custom event emitters to parse and handle responses, manage device connections, and process various data protocols related to MagTek devices. Here’s a breakdown of the key components and functionality:

# MagTek MMS (Mobile Merchant Solution) API - `mt_mms.js`

## Table of Contents
1. [Overview](#overview)
2. [Global Variables](#global-variables)
3. [Device Communication Functions](#device-communication-functions)
4. [Message Parsing Functions](#message-parsing-functions)
5. [Notification Handlers](#notification-handlers)
6. [Helper Functions](#helper-functions)
7. [Troubleshooting](#troubleshooting)
8. [License](#license)

---

### Overview

This module handles interaction with MagTek devices that support MMS (Mobile Merchant Solution) using HID commands. The file provides functions for opening device connections, handling and parsing MMS messages, and emitting relevant events for device responses.

### Global Variables

- `LogMMStoConsole`: Controls logging of MMS messages to the console. Default is `false`.
- `LogMMStoEvent`: Controls logging of MMS messages as events. Default is `false`.
- `wasOpened`: Tracks whether a device was successfully opened. Default is `false`.
- `mtDeviceType`: Stores the device type, e.g., "MMS".
- `device_response`: Holds the response from the device.
- `data_buffer_response`: Buffer for storing multi-packet responses.

### Device Communication Functions

1. `openDevice()`
   - Requests and opens a connection to the MMS device using HID.
   - Sets up an event listener for `inputreport` events to handle incoming data.
   - Returns: The device object if opened successfully.

2. `closeDevice()`
   - Closes the currently connected MMS device, resetting the `wasOpened` flag and emitting a closure event.

3. `sendCommand(cmdToSend)`
   - Sends a command to the MMS device.
   - Parameters: `cmdToSend` - The command string, hex formatted.
   - Returns: Device response if successful, or an error event.

4. `sendMMSCommand(cmdToSend)`
   - Formats and sends the command to the MMS device, breaking it into packets if necessary.
   - Parameters: `cmdToSend` - The command string.
   - Returns: The response from the device.

5. `waitForDeviceResponse()`
   - Polls for a response from the device, waiting for data availability.

### Message Parsing Functions

1. `parseMMSPacket(data)`
   - Handles parsing of different MMS packet types, distinguishing single, head, middle, tail, and cancel packets.
   - Parameters: `data` - The raw data packet.
   
2. `ParseMMSMessage(Msg)`
   - Parses the message data into a structured MMS message format.
   - Parameters: `Msg` - Parsed data message.

3. `parseManualEntryDetail(Msg)`, `parseMSRDetail(Msg)`, `parseContactDetail(Msg)`, `parseContactlessDetail(Msg)`, `parseBarcodeDetail(Msg)`
   - Parse details based on the device data source: manual entry, MSR, contact, contactless, and barcode.
   - Parameters: `Msg` - The data message in a structured format.

### Notification Handlers

1. `parseNotificationFromDevice(Msg)`
   - Handles device notifications by emitting specific events based on response ID.
   - Parameters: `Msg` - Parsed message data.

2. `parsePowerEventDetail(Msg)`, `parseUserEventDetail(Msg)`, `parseKeyEventDetail(Msg)`
   - Handle specific notification types like power events, user events, and key events.
   - Parameters: `Msg` - The message to parse for these events.

3. `parseNotificationFromHost(Msg)`, `parseRequestFromDevice(Msg)`, `parseResponseFromDevice(Msg)`, `parseRequestFromHost(Msg)`, `parseResponseFromHost(Msg)`
   - Handle notifications, requests, and responses between the host and the device.
   - Parameters: `Msg` - Structured message data.

### Helper Functions

1. `buildCmdsArray(commandstring, reportLen)`
   - Splits a command into packets for transmission.
   - Parameters:
     - `commandstring` - The command to be split.
     - `reportLen` - The maximum report length for the device.
   - Returns: Array of command packets.

2. `parseSinglePacket(packet)`, `parseHeadPacket(packet)`, `parseMiddlePacket(packet)`, `parseTailPacket(packet)`, `parseCancelPacket(packet)`
   - Handle packet parsing for different packet types (single, head, middle, tail, cancel).
   - Parameters: `packet` - Raw packet data.

3. `EmitObject(e_obj)`
   - Emits an event with the given event object.
   - Parameters: `e_obj` - Event data.

### Troubleshooting

- Device Not Found: Ensure the device is properly connected and recognized by the system.
- Unknown Packet Type: Review packet formatting and content to ensure command correctness.
- Event Emission Issues: Verify `EventEmitter` is properly set up to receive events.

### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation provides an overview of the configuration, message parsing, and event handling capabilities within `mt_mms.js` for interacting with MagTek MMS devices.