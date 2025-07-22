// device_mmsWebSocket.js
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
import * as mt_MMSParse from "../API_mmsParse.js";
import AbstractDevice from "./API_device_abstract.js"; // Import the abstract class

/**
 * @class MMSWebSocketDevice
 * @augments AbstractDevice
 * @description
 * Implements device communication over WebSocket, adhering to the AbstractDevice interface.
 */
class MMSWebSocketDevice extends AbstractDevice {
  /**
   * @constructor
   * @description
   * Initializes WebSocket-specific properties.
   */
  constructor() {
    super(); // Call the parent constructor to initialize common properties
    this.type = "MMS_WEBSOCKET";
    this._wsAddress = "";
    this._MTWebSocket = null;
  }

  /**
   * @method setURL
   * @param {string} URL - The WebSocket URL to connect to.
   * @description
   * Sets the WebSocket URL for the device.
   */
  setURL(URL) {
    this._wsAddress = URL;
  }

  /**
   * @method openDevice
   * @description
   * Opens a WebSocket connection to the configured URL.
   * Overrides the abstract method from AbstractDevice.
   * @returns {Promise<void>} A promise that resolves when the WebSocket is open.
   */
  async openDevice() {
    if (this._MTWebSocket == null || this._MTWebSocket.readyState !== WebSocket.OPEN) {
      this._MTWebSocket = new WebSocket(this._wsAddress);
      this._MTWebSocket.binaryType = "arraybuffer";
      // Bind event handlers to the class instance
      this._MTWebSocket.onopen = this._ws_onopen.bind(this);
      this._MTWebSocket.onerror = this._ws_onerror.bind(this);
      this._MTWebSocket.onmessage = this._ws_onmessage.bind(this);
      this._MTWebSocket.onclose = this._ws_onclose.bind(this);
    }
  }

  /**
   * @method closeDevice
   * @description
   * Closes the WebSocket connection.
   * Overrides the abstract method from AbstractDevice.
   * @returns {Promise<void>} A promise that resolves when the WebSocket is closed.
   */
  async closeDevice() {
    if (this._MTWebSocket !== undefined && this._MTWebSocket.readyState === WebSocket.OPEN) {
      this._emitObject({ Name: "OnDeviceClose", Device: null });
      // Clear event handlers to prevent memory leaks and unexpected behavior after close
      this._MTWebSocket.onopen = null;
      this._MTWebSocket.onerror = null;
      this._MTWebSocket.onmessage = null;
      this._MTWebSocket.onclose = null;
      this._MTWebSocket.close();
      this._MTWebSocket = undefined; // Clear the WebSocket instance
    }
  }

  /**
   * @method sendCommand
   * @param {string} cmdHexString - The command to send as a hexadecimal string.
   * @description
   * Sends a command over the WebSocket connection.
   * Overrides the abstract method from AbstractDevice.
   * @returns {Promise<any>} A promise that resolves with the device's response after waiting.
   */
  async sendCommand(cmdHexString) {
    window.mt_device_response = null; // Clear previous response
    if (this._MTWebSocket && this._MTWebSocket.readyState === WebSocket.OPEN) {
      this._MTWebSocket.send(cmdHexString);
      // Wait for the device response using the common helper from AbstractDevice
      let Resp = await this._waitForDeviceResponse();
      return Resp;
    } else {
      this._emitObject({Name: "OnError", Source: "SendCommand", Data: "WebSocket not open."});
      return Promise.reject("WebSocket not open.");
    }
  }



  /**
   * @method _ws_onopen
   * @description
   * Handles the WebSocket 'onopen' event.
   * @private
   */
  _ws_onopen() {
    this._emitObject({ Name: "OnDeviceOpen", Device: this._MTWebSocket });
  }

  /**
   * @method _ws_onerror
   * @param {Event} error - The WebSocket error event.
   * @description
   * Handles the WebSocket 'onerror' event.
   * @private
   */
  _ws_onerror(error) {
    this._emitObject({
      Name: "OnError",
      Source: "WSSError",
      Data: error
    });
  }

  /**
   * @method _ws_onmessage
   * @param {MessageEvent} ws_msg - The WebSocket message event.
   * @description
   * Handles the WebSocket 'onmessage' event, processing incoming data.
   * @private
   */
  _ws_onmessage(ws_msg) {
    let dataArray;
    if (typeof ws_msg.data === 'string') {
      dataArray = mt_Utils.hexToBytes(ws_msg.data);
    } else {
      dataArray = new Uint8Array(ws_msg.data);
    }
    this._processMsg(dataArray);
  }

  /**
   * @method _ws_onclose
   * @param {CloseEvent} e - The WebSocket close event.
   * @description
   * Handles the WebSocket 'onclose' event.
   * @private
   */
  _ws_onclose(e) {
    // Handle WebSocket close events, potentially re-connection logic
    this._emitObject({ Name: "OnDeviceClose", Device: null }); // Re-emit close event
  }

  /**
   * @method _processMsg
   * @param {Uint8Array} msg - The message data as a Uint8Array.
   * @description
   * Processes the incoming message using the MMS parser.
   * @private
   */
  _processMsg(msg) {
    mt_MMSParse.ParseMMSMessage(msg);
  }

  /**
   * @method getWSSDevicePage
   * @param {string} url - The URL (wss:// or ws://) to fetch.
   * @description
   * Converts a WebSocket URL to HTTPS/HTTP and fetches its content.
   * This seems to be a utility function rather than a core device communication method,
   * but is kept as per original file.
   * @returns {Promise<object>} A promise resolving with the status of the fetch operation.
   */
  async getWSSDevicePage(url) {
    let resp = null;
    try {
      let _URL = this._convertWssToHttps(url);
      const response = await fetch(_URL, {
        method: "GET",
        mode: "no-cors" // Important for cross-origin requests
      });
      resp = {
        status: {
          ok: response.ok, // Use response.ok for actual status check
          text: response.statusText || "OK",
          code: response.status
        }
      }
      return resp;
    } catch (error) {
      resp = {
        status: {
          ok: false,
          text: `Failed to connect to - ${url}. Error: ${error.message}`,
          code: 0
        }
      }
    }
    return resp;
  }

  /**
   * @method _convertWssToHttps
   * @param {string} url - The WebSocket URL (ws:// or wss://).
   * @description
   * Converts a WebSocket URL scheme to HTTP/HTTPS for fetching.
   * @private
   * @returns {string} The converted URL.
   */
  _convertWssToHttps(url) {
    if (url.startsWith("ws://")) {
      return "http://" + url.substring(5);
    }
    if (url.startsWith("wss://")) {
      return "https://" + url.substring(6);
    }
    return url; // Return original string if no change needed
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

export default MMSWebSocketDevice;
