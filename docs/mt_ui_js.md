This module provides user interface utility functions to display progress, log data, update UI elements, and manage device status for the MagTek device integration.

# MagTek UI Utility Functions - `mt_ui.js`

## Table of Contents
1. [Overview](#overview)
2. [Main Functions](#main-functions)
   - [Progress Bar Functions](#progress-bar-functions)
   - [Log and Display Functions](#log-and-display-functions)
   - [Device Management Functions](#device-management-functions)
   - [Value Management Functions](#value-management-functions)
3. [Troubleshooting](#troubleshooting)
4. [License](#license)

---

### Overview
This module provides user interface utility functions to display progress, log data, update UI elements, and manage device status for the MagTek device integration.

### Main Functions

#### Progress Bar Functions

1. `updateProgressBar(caption, progress)`
   - Updates the progress bar's visibility, caption, and width.
   - Parameters:
     - `caption`: Text displayed alongside the progress.
     - `progress`: Progress percentage (0-100).
   - Behavior: Hides the progress bar if `progress` is negative.

   ```javascript
   export function updateProgressBar(caption, progress) {
     const progressBar = document.getElementById("progressBar");
     progressBar.style.width = `${progress}%`;
     progressBar.textContent = `${caption} ${progress}%`;
   }
   ```

#### Log and Display Functions

1. `LogData(data)`
   - Appends data to the log area and scrolls to the latest entry.
   - Parameters: `data` - Text to be logged.

2. `ClearLog()`
   - Clears all content from the log area and hides the progress bar.

   ```javascript
   export function ClearLog() {
     const log = document.getElementById("LogData");
     log.value = "";
     updateProgressBar("", -1);
   }
   ```

#### Device Management Functions

1. `setUSBConnected(value)`
   - Updates the USB connection status label and icon based on the status (`"opened"`, `"closed"`, `"connected"`, etc.).
   - Parameters: `value` - USB connection status.

   ```javascript
   export function setUSBConnected(value) {
     const label = document.getElementById("lblUSBStatus");
     label.innerText = value;
     const item = document.getElementById("USBStatus");
     switch (value.toLowerCase()) {
       case "opened":
         item.src = "./images/usb-opened.png";
         break;
       case "closed":
         item.src = "./images/usb-closed.png";
         break;
       case "connected":
         item.src = "./images/usb-connected.png";
         break;
       default:
         item.src = "./images/usb-disconnected.png";
     }
   }
   ```

2. `DeviceDisplay(value)`
   - Updates the device display area with a specified message.
   - Parameters: `value` - Text to display.

   ```javascript
   export function DeviceDisplay(value) {
     const item = document.getElementById("DeviceDisplay");
     item.innerText = value.length === 0 ? "WELCOME" : value;
   }
   ```

3. `AddDeviceLink(type, name, status, url)`
   - Dynamically adds or updates a link element representing a device with its online/offline status.
   - Parameters:
     - `type`: Device type (e.g., `V5`).
     - `name`: Device name.
     - `status`: Current status (`connected`, `disconnected`).
     - `url`: Link URL.

   ```javascript
   export function AddDeviceLink(type, name, status, url) {
     const imgOnline = document.createElement('img');
     imgOnline.src = `./images/${status}.png`;
     imgOnline.className = "thumbnail";

     const link = document.createElement('a');
     link.id = `dev-${name}`;
     link.href = url;
     link.textContent = name;
     link.prepend(imgOnline);
     if (status == "disconnected") link.hidden = true;

     document.getElementById('device-links').appendChild(link);
   }
   ```

#### Value Management Functions

1. `UpdateValue(id, value)`
   - Sets the value of a specified element.
   - Parameters: `id`, `value`.

2. `GetValue(id)`
   - Retrieves the value of a specified element.
   - Parameters: `id`.
   - Returns: Value of the element or `null` if an error occurs.

3. `FromListToText(event)`
   - Transfers the selected list value to a text field.
   - Parameters: `event` - The selection event.

### Troubleshooting

- Progress Bar Not Visible: Ensure the progress container elements (`updDeviceContainer`, `progressContainer`, `progressBar`) are correctly referenced and visible in the DOM.
- USB Status Icon Not Updating: Check that images (e.g., `usb-opened.png`, `usb-connected.png`) exist in the specified path (`./images/`).

### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation details how to use the UI utility functions provided in `mt_ui.js` for managing progress display, logging, and device status updates in the MagTek device integration.