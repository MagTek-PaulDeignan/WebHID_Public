This module provides utilities for handling MagTek devices over HID (Human Interface Device) protocol. It allows the detection, identification, and filtering of compatible MagTek devices based on vendorId and productId.


# MagTek HID (Human Interface Device) API - `mt_hid.js`

## Table of Contents
1. [Overview](#overview)
2. [Global Variables](#global-variables)
3. [Device Management Functions](#device-management-functions)
4. [Device Information Functions](#device-information-functions)
5. [Device Filters](#device-filters)
6. [License](#license)

---

### Overview

The `mt_hid.js` module provides functions for handling device identification and interaction with MagTek devices that support HID (Human Interface Device) protocols. It includes functionality to list devices, get device information, and filter supported devices by their Vendor ID and Product ID.

### Global Variables

- `_device`: Stores the reference to the connected device.
- `_deviceType`: Specifies the type of device currently in use (default is `"MMS"`).
- `_reportLen`: Specifies the expected report length for the connected device, based on its Product ID.
- `vendorId`: The Vendor ID for MagTek devices (default is `0x0801`).
- `_productId`: The Product ID for the device, initially set to `0`.

### Device Management Functions

1. `getDeviceList()`
   - Lists all connected HID devices that the navigator can access.
   - Returns: A Promise resolving to an array of devices.

2. `getDeviceInfo(pid)`
   - Provides device-specific information based on its Product ID.
   - Sets `_reportLen` based on the known device capabilities, such as the MMS report length for DynaFlex or DynaProx devices.
   - Parameters: `pid` - The Product ID of the device.
   - Returns: An object with:
     - `DeviceType`: The identified device type (e.g., `MMS`, `V5`, `ID5G3`).
     - `ReportLen`: The report length for the device based on its type.

### Device Filters

The module defines filters for different categories of devices to be used when requesting access to HID devices:

1. `V5filters`
   - Filters for devices in the V5 series (e.g., `mDynamo`, `tDynamo`, `eDynamo`, `iDynamo 6`).
   - Contains an array of product ID filters for V5 devices.

2. `ID5G3filters`
   - Filters for iDynamo 5G3 devices, which use a specific set of Product IDs.

3. `MMSfilters`
   - Filters for devices in the MMS series (e.g., `DynaFlex`, `DynaProx`, `DynaProx II Go`).
   - Allows HID access for both primary and bootloader interfaces of MMS devices.

### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation provides an overview of device identification, report length setup, and filtering based on the device’s characteristics for HID communication in the `mt_hid.js` file.