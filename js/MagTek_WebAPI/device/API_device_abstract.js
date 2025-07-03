// API_device_abstract.js
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

// Import the EventEmitter from mt_events.js (assuming it's globally available or imported elsewhere)
// For this example, we assume mt_events.js makes EventEmitter globally accessible or is imported
// in a way that its 'emit' method is available. If EventEmitter needs explicit import,
// ensure it's handled in your project setup.
import "../mt_events.js"; 
import * as mt_Utils from "../mt_utils.js";


/**
 * @class AbstractDevice
 * @description
 * This abstract class defines the common interface for all device communication types
 * (WebSocket, BLE, HID, MQTT, Serial). It enforces that concrete device classes
 * implement specific methods and provides shared helper utilities.
 */
class AbstractDevice {
  /**
   * @constructor
   * @description
   * Prevents direct instantiation of AbstractDevice and initializes common properties.
   */
  constructor() {
    // Ensure this class cannot be instantiated directly
    if (new.target === AbstractDevice) {
      throw new TypeError("Cannot construct AbstractDevice instances directly");
    }
    // Initialize a common flag for command mode
    this._activeCommandMode = true;
    // Centralized response storage, as used in original files.
    // Consider refactoring this to be instance-specific if possible for better encapsulation.
    window.mt_device_response = null; 
  }

  /**
   * @method openDevice
   * @description
   * Abstract method for opening a connection to the device.
   * Must be implemented by concrete device classes.
   * @returns {Promise<any>} A promise that resolves when the device is opened.
   */
  async openDevice() {
    throw new Error("Method 'openDevice()' must be implemented by a concrete device class.");
  }

  /**
   * @method closeDevice
   * @description
   * Abstract method for closing the connection to the device.
   * Must be implemented by concrete device classes.
   * @returns {Promise<void>} A promise that resolves when the device is closed.
   */
  async closeDevice() {
    throw new Error("Method 'closeDevice()' must be implemented by a concrete device class.");
  }

  /**
   * @method sendCommand
   * @param {string} cmdHexString - The command to send as a hexadecimal string.
   * @description
   * Abstract method for sending a command to the device.
   * Must be implemented by concrete device classes.
   * @returns {Promise<any>} A promise that resolves with the device's response.
   */
  async sendCommand(cmdHexString) {
    throw new Error("Method 'sendCommand()' must be implemented by a concrete device class.");
  }

/**
   * @method sendBase64Command
   * @param {string} cmdToSendB64 - The command in Base64 format.
   * @description
   * Converts a Base64 command to hex and then sends it.
   * Overrides the abstract method.
   * @returns {Promise<any>} A promise that resolves with the device response.
   */
  async sendBase64Command(cmdToSendB64) {
    return await this.sendCommand(mt_Utils.base64ToHex(cmdToSendB64));
  }

  /**
   * @method GetDeviceSN
   * @description
   * Sends a specific command to get the device's serial number and parses the response.
   * @returns {Promise<string>} A promise that resolves with the device serial number.
   */
  async GetDeviceSN() {
   throw new Error("Method 'GetDeviceSN()' must be implemented by a concrete device class.");
  }

  /**
   * @method GetDeviceFWID
   * @description
   * Sends a specific command to get the device's firmware ID and parses the response.
   * @returns {Promise<string>} A promise that resolves with the device firmware ID.
   */
  async GetDeviceFWID() {
  throw new Error("Method 'GetDeviceFWID()' must be implemented by a concrete device class.");  
  }

  /**
   * @method setActiveCommandMode
   * @param {string} mode - A string "true" or "false" to set the command mode.
   * @description
   * Sets the active command mode for the device. This is a common method across all devices.
   */
  setActiveCommandMode(mode) {
    this._activeCommandMode = (mode === "true");
  }

  /**
   * @method _waitForDeviceResponse
   * @description
   * A helper method to wait for a global device response.
   * @private
   * @returns {Promise<any>} A promise that resolves when `window.mt_device_response` is set.
   */
  async _waitForDeviceResponse() {
    function waitFor(result) {
      if (result) {
        return result;
      }
      return new Promise((resolve) => setTimeout(resolve, 50))
        .then(() => Promise.resolve(window.mt_device_response)) 
        .then((res) => waitFor(res));
    }
    return waitFor();
  }

  /**
   * @method _emitObject
   * @param {object} e_obj - The event object to emit.
   * @description
   * A helper method to emit custom events using the global EventEmitter.
   * @private
   */
  _emitObject(e_obj) {
    // Assuming EventEmitter is globally available or correctly imported via mt_events.js
    if (typeof EventEmitter !== 'undefined' && EventEmitter.emit) {
      EventEmitter.emit(e_obj.Name, e_obj);
    } else {
      console.warn("EventEmitter not found or not initialized. Cannot emit event:", e_obj);
    }
  }
}

export default AbstractDevice;
