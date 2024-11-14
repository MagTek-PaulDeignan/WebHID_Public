This Javascript enables MagTek device update operations including firmware and configuration updates, tag management, and command handling via the MagTek V5 API and RMS API. It is designed for use with devices that communicate over USB and potentially have BLE firmware.


# MagTek Device RMS Functions - `mt_rms.js`

## Table of Contents
1. [Overview](#overview)
2. [Global Variables](#global-variables)
3. [Main Functions](#main-functions)
   - [Device Update Functions](#device-update-functions)
   - [Configuration Functions](#configuration-functions)
   - [Command Processing Functions](#command-processing-functions)
4. [Helper Functions](#helper-functions)
5. [Troubleshooting](#troubleshooting)
6. [License](#license)

---

### Overview
This module is responsible for managing device configurations and firmware updates for MagTek devices using RMS API integration. Key functionalities include checking for firmware updates, updating device configurations, and executing RMS commands.

### Global Variables

- `_KSN`, `_UIK`, `_FWID`, `_BLEFWID`, `_MUT`: Stores key values specific to the device, such as firmware ID and hardware security parameters.
- `_DeviceDetected`: Boolean flag indicating if a device is detected.
- `_HasBLEFirmware`: Boolean flag for devices that support Bluetooth Low Energy (BLE) firmware.
- `_DeviceConfigList`: List of configurations available for the device.

### Main Functions

#### Device Update Functions

1. `updateDevice()`
   - Performs a complete update check on the device, including firmware and configuration updates.
   - Logs update progress and final status to the RMS log.

   ```javascript
   export async function updateDevice() {
     LogData(`${mt_RMS_API.ProfileName}: Checking for updates...`);
     await getDeviceInfo();
     await updateFirmware("Main");
     if (_HasBLEFirmware) await updateFirmware("BLE");
     await updateAllTags();
     await updateAllConfigs();
     LogData(`Device has been updated`);
     updateProgress("", -1);
   }
   ```

2. `getDeviceInfo()`
   - Retrieves basic device information, such as KSN, UIK, FWID, and MUT.
   - Saves each retrieved value using the `mt_Utils.saveDefaultValue` function.

3. `updateFirmware(fwType)`
   - Checks and updates the specified firmware type (`"Main"` or `"BLE"`) on the device.
   - Parameters: `fwType` - Firmware type to update.
   - Returns: `true` if successful, otherwise logs an error.

   ```javascript
   async function updateFirmware(fwType) {
     LogData(`Checking ${fwType} firmware...`);
     // Fetch and apply firmware update commands if available.
     await parseRMSCommands(firmwareResp.Description, firmwareResp.Commands);
   }
   ```

#### Configuration Functions

1. `updateAllConfigs()`
   - Checks and updates all device-specific configurations.
   - Returns: `true` if all configurations are updated successfully.

2. `updateConfig(configname)`
   - Updates a single configuration by name.
   - Parameters: `configname` - Name of the configuration to update.
   - Returns: `true` if the update is successful, otherwise logs an error.

#### Command Processing Functions

1. `parseRMSCommand(message)`
   - Parses and executes a given RMS command.
   - Parameters: `message` - Command to execute in comma-separated format (e.g., `"SENDCOMMAND,0900"`).
   - Returns: Command response or logs a message.

   ```javascript
   async function parseRMSCommand(message) {
     let cmd = message.split(",");
     switch (cmd[0].toUpperCase()) {
       case "SENDCOMMAND":
         return await mt_V5.sendCommand(cmd[1]);
       case "WAIT":
         await mt_Utils.wait(parseInt(cmd[1]));
         break;
       default:
         LogData(`Unknown Parse Command: ${cmd[0]}`);
     }
   }
   ```

2. `parseRMSCommands(description, messageArray)`
   - Processes multiple commands sequentially and updates the progress bar.
   - Parameters: `description` - Description of the command set; `messageArray` - Array of commands to process.

#### Helper Functions

1. `EmitObject(e_obj)`
   - Emits a custom event with the specified object data.
   - Parameters: `e_obj` - Event object with `Name` and `Data` properties.

2. `LogData(data)`
   - Logs data to the RMS log event.

3. `updateProgress(caption, progress)`
   - Updates the progress bar with a specified caption and progress percentage.

### Troubleshooting

- Device Not Detected: Ensure `_DeviceDetected` is correctly set by calling `setDeviceDetected(true)` once the device is confirmed connected.
- Firmware or Config Update Fails: Verify that firmware IDs (`_FWID`, `_BLEFWID`) and configuration names are correct.
- Unknown Parse Command: Ensure commands passed to `parseRMSCommand` are properly formatted and recognized by the switch cases.

### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation provides details on functions for managing RMS-based device updates and configurations, including command parsing and handling for MagTek devices.