// device_mmsSerial.js
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
import * as mt_SLIP from "../slip.js"; // Assuming slip.js provides SLIP encoding/decoding
import AbstractDevice from "./API_device_abstract.js"; // Import the abstract class

/**
 * @class MMSSerialDevice
 * @augments AbstractDevice
 * @description
 * Implements device communication over Web Serial API (UART/USB-Serial),
 * using SLIP protocol for framing, and adhering to the AbstractDevice interface.
 */
class MMSSerialDevice extends AbstractDevice {
  /**
   * @constructor
   * @description
   * Initializes Serial port specific properties and SLIP decoder.
   */
  constructor() {
    super(); // Call the parent constructor
    this.type = "MMS_Serial";
    this._filters = mt_Configs.MMSfilters; // Serial port filters from configuration (if any)
    this.mtDeviceType = ""; // Device type identifier
    this.port_connected = false; // Connection status flag
    this.port = null; // Holds the SerialPort instance
    this.portReader = null; // ReadableStreamDefaultReader for the port
    this.portWriter = null; // WritableStreamDefaultWriter for the port
    this.keepReading = true; // Flag to control the read loop

    // Initialize SLIP decoder, binding the message handler to this instance
    this.slipDecoder = new mt_SLIP.Decoder({
      onMessage: this._unSlippedMessage.bind(this),
      maxMessageSize: 209715200, // Max message size for SLIP
      bufferSize: 2048 // Buffer size for SLIP decoder
    });

    this._readLoopPromise = null; // To hold the promise of the read loop for graceful shutdown
  }

  /**
   * @method _readUntilClosed
   * @description
   * Continuously reads data from the serial port using the SLIP decoder.
   * This loop runs until `keepReading` is false or an error occurs.
   * @private
   * @returns {Promise<void>} A promise that resolves when the reading loop terminates.
   */
  async _readUntilClosed() {
    if (!this.port) return; // Ensure port exists

    // Acquire reader and writer locks only once per open session
    try {
      this.portWriter = this.port.writable.getWriter();
      this.portReader = this.port.readable.getReader();
    } catch (error) {
      console.error("Failed to get port reader/writer:", error);
      this._emitObject({ Name: "OnError", Source: "SerialPort", Data: `Failed to get port streams: ${error.message}` });
      this.keepReading = false; // Stop if we can't get streams
      return;
    }

    while (this.port && this.keepReading) {
      try {
        const { value, done } = await this.portReader.read();
        if (done) {
          // Reader has been cancelled or port closed externally
          this.portReader.releaseLock();
          break;
        }
        this.slipDecoder.decode(new Uint8Array(value));
      } catch (error) {
        // Handle read errors (e.g., port disconnected)
        console.error("Serial read error:", error);
        this._emitObject({ Name: "OnError", Source: "SerialRead", Data: `Serial read error: ${error.message}` });
        this.keepReading = false; // Stop reading on error
        break; // Exit loop
      }
    }
    // Release locks when loop exits
    if (this.portReader) {
      try {
        this.portReader.releaseLock();
      } catch (e) { console.warn("Error releasing serial reader lock:", e); }
    }
    if (this.portWriter) {
      try {
        this.portWriter.releaseLock();
      } catch (e) { console.warn("Error releasing serial writer lock:", e); }
    }
    console.log("Serial read loop terminated.");
  }

  /**
   * @method _writeSlipData
   * @param {string} data - The hexadecimal string data to send.
   * @description
   * Encodes the given data using SLIP protocol and writes it to the serial port.
   * Includes direction byte and 4-byte length prefix as per protocol.
   * @private
   * @returns {Promise<void>} A promise that resolves when data is written.
   */
  async _writeSlipData(data) {
    // Direction byte (e.g., "00" for host to device)
    let direction = "00";
    // Message length (4 bytes, big-endian hex)
    let msgLen = mt_Utils.makeHex(data.length / 2, 8); // Data length in bytes (hex string is 2 chars per byte)
    // Combine direction, length, and actual data, then convert to bytes
    let bytesToSend = mt_Utils.hexToBytes(`${direction}${msgLen}${data}`);
    // SLIP encode and write to port
    if (this.portWriter) {
      await this.portWriter.write(mt_SLIP.encode(bytesToSend));
    } else {
      throw new Error("Serial port writer not available.");
    }
  }

  /**
   * @method _unSlippedMessage
   * @param {Uint8Array} msg - The un-SLIP-encoded message.
   * @description
   * Callback for the SLIP decoder when a full message is received.
   * Removes protocol-specific prefix and passes to the MMS parser.
   * @private
   */
  _unSlippedMessage(msg) {
    // The SLIP/UART format has a direction byte (1st byte) and 4-byte length (next 4 bytes),
    // which are removed here.
    mt_MMS.ParseMMSMessage(msg.slice(5, msg.length));
  }

  /**
   * @method getDeviceList
   * @description
   * Retrieves a list of available serial ports.
   * (Original code commented out filtering, so it returns all available ports).
   * @returns {Promise<SerialPort[]>} A promise that resolves with an array of SerialPort objects.
   */
  async getDeviceList() {
    let devices = await navigator.serial.getPorts();
    // devices = mt_Configs.filterDevices(devices, this._filters); // Re-add if you need specific filters
    return devices;
  }


  /**
   * @method sendCommand
   * @param {string} cmdHexString - The command in hexadecimal string format.
   * @description
   * Sends a command to the serial device, checking connection status and command mode.
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

      if (this.port == null) {
        this._emitObject({
          Name: "OnError",
          Source: "SendCommand",
          Data: "Device is null",
        });
        return 0;
      }
      if (!this.port_connected) {
        this._emitObject({
          Name: "OnError",
          Source: "SendCommand",
          Data: "Device is not open",
        });
        return 0;
      }
      let sanitizedData = mt_Utils.sanitizeHexData(cmdHexString);
      if(!mt_Utils.isBase16(sanitizedData)){
        this._emitObject({ Name: "OnError", Source: "SendCommand", Data: "Invalid command (data is not hex)" });
        return 0;
      }
      cmdResp = await this._sendMMSCommand(sanitizedData);
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
   * Internal method to send a command via SLIP to the serial port.
   * @private
   * @returns {Promise<any>} A promise that resolves with the device response after sending.
   */
  async _sendMMSCommand(cmdToSend) {
    await this._writeSlipData(cmdToSend);
    const Response = await this._waitForDeviceResponse();
    return Response;
  }


  /**
   * @method openDevice
   * @description
   * Requests a serial port, opens it with a baud rate, and starts the reading loop.
   * Overrides the abstract method.
   * @returns {Promise<SerialPort>} A promise that resolves with the connected SerialPort object.
   */
  async openDevice() {
    try {
      let reqDevice;
      let devices = await this.getDeviceList();
      // Try to find an already granted port, or request a new one
      this.port = devices.find((d) => true); // Original code picks the first available port

      if (!this.port) {
        reqDevice = await navigator.serial.requestPort();
        if (reqDevice != null) {
          this.port = reqDevice;
        } else {
          this._emitObject({ Name: "OnError", Source: "OpenDevice", Data: "No Serial Port selected or found." });
          throw new Error("No Serial Port selected or found.");
        }
      }

      const info = this.port.getInfo(); // Get port information
      this.mtDeviceType = "MMS_SLIP"; // Set device type

      if (this.port.readable == null) { // Check if port is not already opened/readable
        await this.port.open({ baudRate: 115200 }); // Open the port
        this.port_connected = true;
        this.keepReading = true; // Ensure reading loop starts
        this.port.addEventListener("connect", this._handleConnect.bind(this));
        this.port.addEventListener("disconnect", this._handleDisconnect.bind(this));
        this._readLoopPromise = this._readUntilClosed(); // Start the reading loop
      }
      this._emitObject({ Name: "OnDeviceOpen", Device: this.port });
      return this.port;
    } catch (error) {
      console.error("Error opening Serial device:", error);
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
   * Stops the reading loop, releases port locks, and closes the serial port.
   * Overrides the abstract method.
   * @returns {Promise<void>} A promise that resolves when the device is closed.
   */
  async closeDevice() {
    if (this.port != null) {
      this.port_connected = false;
      window.mt_device_WasOpened = false; // Global flag
      this.keepReading = false; // Signal the read loop to stop

      // Cancel reader and wait for the read loop to finish
      if (this.portReader) {
        try {
          await this.portReader.cancel();
          await this._readLoopPromise; // Wait for the read loop to truly finish
        } catch (e) {
          console.warn("Error during serial reader cancel/wait:", e);
        }
      }
      // Release writer lock
      if (this.portWriter) {
        try {
          await this.portWriter.releaseLock();
        } catch (e) {
          console.warn("Error releasing serial writer lock:", e);
        }
      }
      // Close the port itself
      if (this.port.opened) {
        try {
          await this.port.close();
        } catch (e) {
          console.warn("Error closing serial port:", e);
        }
      }

      // Clear references
      this.port = null;
      this.portReader = null;
      this.portWriter = null;
      this._readLoopPromise = null;
    }
    this._emitObject({ Name: "OnDeviceClose", Device: null });
  }

  /**
   * @method _handleConnect
   * @param {Event} event - The connect event.
   * @description
   * Handles the serial port 'connect' event.
   * @private
   */
  _handleConnect(event) {
    console.log("Serial port connected:", JSON.stringify(event));
    this.port_connected = true;
  }

  /**
   * @method _handleDisconnect
   * @param {Event} event - The disconnect event.
   * @description
   * Handles the serial port 'disconnect' event.
   * Resets connection state and clears port references.
   * @private
   */
  _handleDisconnect(event) {
    console.log("Serial port disconnected:", JSON.stringify(event));
    this.port_connected = false;
    this.keepReading = false; // Ensure reading stops
    this.port = null; // Clear port reference
    this._emitObject({ Name: "OnDeviceDisconnect", Device: null });
  }
  /**
   * @method GetDeviceSN
   * @description
   * Sends a specific command to get the device's serial number and parses the response.
   * Overrides the abstract method.
   * @returns {Promise<string>} A promise that resolves with the device serial number.
   */
  async GetDeviceSN() {
    let resp = await this.sendCommand("AA0081040100D101841AD10181072B06010401F609850102890AE208E106E104E102C100");
    let str = resp.TLVData.substring(24);
    let tag89 = mt_Utils.getTagValue("89", "", str, false);
    let data = mt_Utils.getTagValue("C1", "", tag89, false);
    return data.substring(0, 7);
  }

  /**
   * @method GetDeviceFWID
   * @description
   * Sends a specific command to get the device's firmware ID and parses the response.
   * Overrides the abstract method.
   * @returns {Promise<string>} A promise that resolves with the device firmware ID.
   */
  async GetDeviceFWID() {
    let resp = await this.sendCommand("AA0081040102D101841AD10181072B06010401F609850102890AE108E206E204E202C200");
    let str = resp.TLVData.substring(24);
    let tag89 = mt_Utils.getTagValue("89", "", str, false);
    let data = mt_Utils.getTagValue("C2", "", tag89, true);
    return data;
  }

  
    /**
     * @method GetDeviceWifiFWID
     * @description
     * Sends a specific command to get the device's Wifi firmware ID and parses the response.
     * Overrides the abstract method.
     * @returns {Promise<string>} A promise that resolves with the device firmware ID.
     */
    async GetDeviceWifiFWID() {
      let resp = await this.sendCommand("AA0081040108D101841AD10181072B06010401F609850102890AE108E206E504E302C100");
      let str = resp.TLVData.substring(24);
      let tag89 = mt_Utils.getTagValue("89", "", str, false);
      let data = mt_Utils.getTagValue("C1", "", tag89, true);
      return data;
    }
  
      /**
     * @method GetDeviceBLEFWID
     * @description
     * Sends a specific command to get the device's Wifi firmware ID and parses the response.
     * Overrides the abstract method.
     * @returns {Promise<string>} A promise that resolves with the device firmware ID.
     */
    async GetDeviceBLEFWID() {
      let resp = await this.sendCommand("AA0081040109D101841AD10181072B06010401F609850102890AE108E206E704E102C100");
      let str = resp.TLVData.substring(24);
      let tag89 = mt_Utils.getTagValue("89", "", str, false);
      let data = mt_Utils.getTagValue("C1", "", tag89, true);
      return data;
    }
  
    /**
     * @method GetDeviceBootFWID
     * @description
     * Sends a specific command to get the device's Wifi firmware ID and parses the response.
     * Overrides the abstract method.
     * @returns {Promise<string>} A promise that resolves with the device firmware ID.
     */
    async GetDeviceBootFWID() {
      let resp = await this.sendCommand("AA008104010BD101841AD10181072B06010401F609850102890AE108E206E104E102C200");
      let str = resp.TLVData.substring(24);
      let tag89 = mt_Utils.getTagValue("89", "", str, false);
      let data = mt_Utils.getTagValue("C2", "", tag89, true);
      return data;
    }
  

}

export default MMSSerialDevice;
