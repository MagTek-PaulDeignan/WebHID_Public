// device_mmsHID.js
/* DO NOT REMOVE THIS COPYRIGHT
 Copyright 2020-2025 MagTek, Inc, Paul Deignan.
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as mt_Utils from "../mt_utils.js";
import * as mt_MMS from "../API_mmsParse.js";
import * as mt_Configs from "../config/DeviceConfig.js";
import AbstractDevice from "./API_device_abstract.js"; // Import the abstract class

/**
 * @class MMSHIDDevice
 * @augments AbstractDevice
 * @description
 * Implements device communication over WebHID, adhering to the AbstractDevice interface.
 */
class MMSHIDDevice extends AbstractDevice {
  /**
   * @constructor
   * @description
   * Initializes HID-specific properties.
   */
  constructor() {
    super(); // Call the parent constructor
    this.type = "MMS_HID";
    this._filters = mt_Configs.MMSfilters; // HID device filters from configuration
    this.mtDeviceType = ""; // Device type identifier (e.g., "MMS", "V5")
    this._device = null; // Holds the connected HID device instance

    //Add the hid event listener for connect/plug in
    navigator.hid.addEventListener("connect", ({ device }) => {
    this._emitObject({Name:"OnDeviceConnect", Device:device});});
    //Add the hid event listener for disconnect/unplug
    navigator.hid.addEventListener("disconnect", ({ device }) => {
    this._emitObject({Name:"OnDeviceDisconnect", Device:device});});
  }

  /**
   * @method getDeviceList
   * @description
   * Retrieves a list of available HID devices based on configured filters.
   * @returns {Promise<HIDDevice[]>} A promise that resolves with an array of HID devices.
   */
  async getDeviceList() {
    // navigator.hid.getDevices() requires prior user permission for already granted devices.
    let devices = await navigator.hid.getDevices();
    devices = mt_Configs.filterDevices(devices, this._filters);
    return devices;
  }

  
  /**
   * @method sendCommand
   * @param {string} cmdHexString - The command in hexadecimal string format.
   * @description
   * Sends a command to the HID device, checking connection status and command mode.
   * Overrides the abstract method.
   * @returns {Promise<any>} A promise that resolves with the device response.
   */
  async sendCommand(cmdHexString) {
    let cmdResp = "";
    window.mt_device_response = null; // Global response, as per original structure
    try {
      if (!this._activeCommandMode) {
        this._emitObject({
          Name: "OnError",
          Source: "SendCommand",
          Data: "Session not active",
        });
        return 0;
      }

      if (this._device == null) {
        this._emitObject({
          Name: "OnError",
          Source: "SendCommand",
          Data: "Device is null",
        });
        return 0;
      }
      if (!this._device.opened) {
        this._emitObject({
          Name: "OnError",
          Source: "SendCommand",
          Data: "Device is not open",
        });
        return 0;
      }

      cmdResp = await this._sendMMSCommand(mt_Utils.sanitizeHexData(cmdHexString));
      return cmdResp;
    } catch (error) {
      this._emitObject({ Name: "OnError", Source: "SendCommand", Data: error });
      return error; // Return error or re-throw
    }
  }

  /**
   * @method _sendMMSCommand
   * @param {string} cmdToSend - The command in hexadecimal string format.
   * @description
   * Internal method to send a command by building report arrays and writing to the HID device.
   * @private
   * @returns {Promise<any>} A promise that resolves with the device response after sending all reports.
   */
  async _sendMMSCommand(cmdToSend) {
    // Assuming the first collection and output report are the correct ones to use.
    // This might need adjustment based on specific HID device descriptors.
    const reportCount = this._device.collections[0]?.outputReports[0]?.items[0]?.reportCount;
    if (!reportCount) {
      const errorMsg = "HID device output report properties not found. Cannot send command.";
      this._emitObject({ Name: "OnError", Source: "_sendMMSCommand", Data: errorMsg });
      throw new Error(errorMsg);
    }

    let commands = mt_MMS.buildCmdsArray(cmdToSend, reportCount);
    for (let index = 0; index < commands.length; index++) {
      // Report ID is 0 for devices that don't use report IDs or use a default one.
      await this._device.sendReport(0, new Uint8Array(commands[index]));
      this._emitObject({ Name: "OnDeviceSendProgress", Total: commands.length, Progress: index });
    }
    const Response = await this._waitForDeviceResponse();
    return Response;
  }

  

  /**
   * @method openDevice
   * @description
   * Requests an HID device, opens it, and sets up an input report listener.
   * Overrides the abstract method.
   * @returns {Promise<HIDDevice>} A promise that resolves with the connected HID device.
   */
  async openDevice() {
    try {
      let reqDevice;
      let devices = await this.getDeviceList();
      // Try to find a device based on vendorId from config
      this._device = devices.find((d) => d.vendorId === mt_Configs.vendorId);

      // If no device found among already granted, request a new one
      if (!this._device) {
        reqDevice = await navigator.hid.requestDevice({ filters: this._filters });
        if (reqDevice && reqDevice.length > 0) {
          this._device = reqDevice[0];
        } else {
          this._emitObject({ Name: "OnError", Source: "OpenDevice", Data: "No HID device selected or found." });
          throw new Error("No HID device selected or found.");
        }
      }

      // Open the device if it's not already opened
      if (!this._device.opened) {
        await this._device.open();
        // Add listener for incoming data reports
        this._device.removeEventListener("inputreport", this._handleInputReport.bind(this));
        this._device.addEventListener("inputreport", this._handleInputReport.bind(this));
      }

      // If device is successfully opened
      if (this._device.opened) {
        window.mt_device_WasOpened = true; // Global flag, as per original structure
        let _devinfo = mt_Configs.getHIDDeviceInfo(this._device.productId);
        this.mtDeviceType = _devinfo.DeviceType; // Set device type

        // Emit OnDeviceOpen based on device type
        switch (this.mtDeviceType) {
          case "MMS":
          case "V5": // V5 also seems to use HID, though its parser is separate
            this._emitObject({ Name: "OnDeviceOpen", Device: this._device });
            break;
          default:
            this._emitObject({
              Name: "OnError",
              Source: "Bad DeviceType",
              Data: `Use the ${this.mtDeviceType} Parser`
            });
            break;
        }
      }
      return this._device;
    } catch (error) {
      console.error("Error opening HID device:", error);
      this._emitObject({
        Name: "OnError",
        Source: "OpenDevice",
        Data: `Error opening device: ${error.message}`,
      });
      throw error; // Re-throw to propagate the error
    }
  }

  /**
   * @method closeDevice
   * @description
   * Closes the HID device connection.
   * Overrides the abstract method.
   * @returns {Promise<void>} A promise that resolves when the device is closed.
   */
  async closeDevice() {
    window.mt_device_WasOpened = false; // Global flag
    if (this._device != null && this._device.opened) {
      // Remove input report listener before closing
      this._device.removeEventListener("inputreport", this._handleInputReport.bind(this));
      await this._device.close();
      this._emitObject({ Name: "OnDeviceClose", Device: this._device });
      this._device = null; // Clear device reference
    }
  }

  /**
   * @method _handleInputReport
   * @param {HIDInputReportEvent} e - The input report event.
   * @description
   * Handles incoming input reports from the HID device and dispatches to appropriate parsers.
   * @private
   */
  _handleInputReport(e) {
    let dataArray = new Uint8Array(e.data.buffer);
    switch (this.mtDeviceType) {
      case "CMF":
        this._emitObject({
          Name: "OnError",
          Source: "DeviceType",
          Data: "CMF Device Type Not Implemented For HID",
        });
        break;
      case "MMS":
        mt_MMS.parseMMSPacket(dataArray);
        break;
      case "V5":
        this._emitObject({
          Name: "OnError",
          Source: "DeviceType",
          Data: "V5 Parser Not Integrated for HID",
        });
        break;
      default:
        this._emitObject({
          Name: "OnError",
          Source: "DeviceType",
          Data: "Unknown Device Type for HID",
        });
        break;
    }
  }
}

export default MMSHIDDevice;
