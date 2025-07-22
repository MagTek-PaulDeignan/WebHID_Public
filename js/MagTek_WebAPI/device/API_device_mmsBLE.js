// API_device_mmsBLE.js
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
 * @class MMSBLEDevice
 * @augments AbstractDevice
 * @description
 * Implements device communication over Bluetooth Low Energy (BLE), adhering to the AbstractDevice interface.
 */
class MMSBLEDevice extends AbstractDevice {
  /**
   * @constructor
   * @description
   * Initializes BLE-specific properties and UUIDs.
   */
  constructor() {
    super(); // Call the parent constructor
    this.type = "MMS_BLE";
    this.messageSndCounter = 0; // Counter for outgoing messages
    this.messageRcvCounter = 0; // Counter for incoming messages (though not used in provided snippet)
    this.device = null; // Holds the connected Bluetooth device
    this.dynaFlexService = null; // Holds the primary BLE service
    this.messageFromHostCharacteristic = null; // Characteristic for sending commands to device
    this.messageToHostCharacteristic = null; // Characteristic for receiving notifications from device
    this.bleReceivedData = { // Buffer for fragmented BLE messages
      MsgNumber: 0,
      MsgLen: 0,
      Data: []
    };

    // BLE Service and Characteristic UUIDs specific to DynaFlex devices
    this.DYNAFLEX_SERVICE_UUID = '0cba14b7-ff24-47b0-be09-26440538530c';
    this.MESSAGE_FROM_HOST_CHARACTERISTIC_UUID = '47f05ffa-5909-4969-bc57-250d47e874e5';
    this.MESSAGE_TO_HOST_CHARACTERISTIC_UUID = 'fed49118-c7e2-4a61-9ed5-e6dd65c3071b';
    this._filters = mt_Configs.MMSfilters; // Device filters from configuration
    this.mtDeviceType = ""; // Device type identifier
    this.handleMessageToHostNotificationsRef = null;
  }

  /**
   * @method setActiveCommandMode
   * @param {string} mode - A string "true" or "false".
   * @description
   * Overrides the parent method to set the active command mode.
   */
  setActiveCommandMode(mode) {
    this._activeCommandMode = (mode === "true");
  }

  /**
   * @method _getMessageLength
   * @param {Uint8Array} message - The message buffer containing the length.
   * @description
   * Extracts the total message length from a BLE PDU.
   * @private
   * @returns {number} The total message length.
   */
  _getMessageLength(message) {
    let buffer = message.slice(3, 7); // Length is at bytes 3-6 (inclusive)
    let length = (buffer[0] * 0x1000000) + (buffer[1] * 0x10000) + (buffer[2] * 0x100) + buffer[3];
    return length;
  }

  /**
   * @method _parseBLEPDU
   * @param {DataView} message - The BLE PDU received.
   * @description
   * Parses an incoming BLE PDU, reconstructs the full message, and processes it.
   * @private
   */
  _parseBLEPDU(message) {
    let buffer = new Uint8Array(message.buffer);
    let _MessageCounter = buffer[0]; // Message counter (byte 0)
    let _PDUCounter = buffer[1];     // PDU counter (byte 1)

    switch (_PDUCounter) {
      case 0:
        // First PDU contains total message length and initial data chunk
        this.bleReceivedData.MsgLen = this._getMessageLength(buffer);
        this.bleReceivedData.Data = []; // Reset data buffer for new message
        this.bleReceivedData.Data.push(...buffer.slice(7)); // Data starts from byte 7
        break;
      default:
        // Subsequent PDUs contain only data
        this.bleReceivedData.Data.push(...buffer.slice(2)); // Data starts from byte 2
        break;
    }

    // If all data for the current message has been received
    if (this.bleReceivedData.Data.length >= this.bleReceivedData.MsgLen) {
      mt_MMS.ParseMMSMessage(new Uint8Array(this.bleReceivedData.Data));
      // Clear for next message (optional, as it's reset on PDUCounter 0)
      this.bleReceivedData.Data = []; 
      this.bleReceivedData.MsgLen = 0;
    }
  }

  /**
   * @method _handleMessageToHostNotifications
   * @param {Event} event - The characteristicvaluechanged event.
   * @description
   * Event listener for notifications from the "Message To Host" characteristic.
   * @private
   */
  _handleMessageToHostNotifications(event) {
    this._parseBLEPDU(event.target.value);
  }

  /**
   * @method _onDisconnected
   * @param {Event} event - The gattserverdisconnected event.
   * @description
   * Handles device disconnection, clearing references and emitting an event.
   * @private
   */
  _onDisconnected(event) {
    const disconnectedDevice = event.target;
    this.device = null;
    this.dynaFlexService = null;
    this.messageFromHostCharacteristic = null;
    this.messageToHostCharacteristic = null;
    this._emitObject({ Name: "OnDeviceClose", Device: disconnectedDevice });
  }

  /**
   * @method getDeviceList
   * @description
   * Retrieves a list of available BLE devices based on filters.
   * (Original code commented out `navigator.bluetooth.getDevices()` and returned empty array)
   * @returns {Promise<BluetoothDevice[]>} A promise that resolves with an array of Bluetooth devices.
   */
  async getDeviceList() {
    // Note: navigator.bluetooth.getDevices() often requires prior user permission.
    // The original code returned an empty array, mirroring that behavior for now.
    // let devices = await navigator.bluetooth.getDevices();
    // devices = mt_Configs.filterDevices(devices, this._filters);
    // return devices;
    return [];
  }

  

  /**
   * @method sendCommand
   * @param {string} cmdToSend - The command in hexadecimal string format.
   * @description
   * Sends a command to the BLE device, first checking connection status and command mode.
   * Overrides the abstract method.
   * @returns {Promise<any>} A promise that resolves with the device response.
   */
  async sendCommand(cmdToSend) {
    let cmdResp = "";
    window.mt_device_response = null; // Global response, as per original structure
    try {
      if (!this._activeCommandMode) {
        this._emitObject({
          Name: "OnError",
          Source: "SendCommand",
          Data: "Session not active",
        });
        return 0; // Return 0 or reject promise appropriately
      }

      if (this.device == null) {
        this._emitObject({ Name: "OnError", Source: "SendCommand", Data: "Device is null" });
        return 0;
      }
      if (!this.device.gatt.connected) {
        this._emitObject({ Name: "OnError", Source: "SendCommand", Data: "Device is not open" });
        return 0;
      }

      cmdResp = await this._sendMMSBLECommand(mt_Utils.sanitizeHexData(cmdToSend));
      return cmdResp;
    } catch (error) {
      this._emitObject({ Name: "OnError", Source: "SendCommand", Data: error });
      return error; // Return error or re-throw for upstream handling
    }
  }

  /**
   * @method _sendMMSBLECommand
   * @param {string} cmdToSend - The command in hexadecimal string format.
   * @description
   * Internal method to send a command by fragmenting it into PDUs and writing to the characteristic.
   * @private
   * @returns {Promise<any>} A promise that resolves with the device response after sending all PDUs.
   */
  async _sendMMSBLECommand(cmdToSend) {
    let commands = this._generatePDUsForMessage(cmdToSend);
    for (let index = 0; index < commands.length; index++) {
      await this.messageFromHostCharacteristic.writeValueWithResponse(commands[index]);
      this._emitObject({ Name: "OnDeviceSendProgress", Total: commands.length, Progress: index });
    }
    const Response = await this._waitForDeviceResponse();
    return Response;
  }

  
  /**
   * @method openDevice
   * @description
   * Requests a BLE device, connects to its GATT server, discovers services/characteristics,
   * and enables notifications.
   * Overrides the abstract method.
   * @returns {Promise<BluetoothDevice>} A promise that resolves with the connected Bluetooth device.
   */
  async openDevice() {
    try {
      let server = null;
      // If no device is already selected/connected, request one
      if (!this.device) {
        this.device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [this.DYNAFLEX_SERVICE_UUID] }],
          optionalServices: [this.DYNAFLEX_SERVICE_UUID]
        });
      }

      // Add a listener for when the device disconnects
      if (this.disconnectedRef != null){
        this.device.removeEventListener('gattserverdisconnected', this.disconnectedRef);
      }
      this.disconnectedRef = this._onDisconnected.bind(this);
      this.device.addEventListener('gattserverdisconnected', this.disconnectedRef);

      //console.log(`Connecting to "${this.device.name || this.device.id}"...`);

      // Connect to the GATT server
      server = await this.device.gatt.connect();

      if (!server) {
        throw new Error('Failed to establish GATT connection or retrieve GATT server.');
      }

      window.mt_device_WasOpened = true; // Global flag, as per original structure
      this._emitObject({ Name: "OnDeviceOpen", Device: this.device });

      //console.log('Discovering services and characteristics...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for service discovery

      // Get the DynaFlex service
      this.dynaFlexService = await server.getPrimaryService(this.DYNAFLEX_SERVICE_UUID);
      //console.log('DynaFlex Service:', this.dynaFlexService);

      // Get the "Message From Host" characteristic (for sending commands)
      this.messageFromHostCharacteristic = await this.dynaFlexService.getCharacteristic(this.MESSAGE_FROM_HOST_CHARACTERISTIC_UUID);
      //console.log('Message From Host Characteristic:', this.messageFromHostCharacteristic);

      // Get the "Message To Host" characteristic (for receiving notifications)
      this.messageToHostCharacteristic = await this.dynaFlexService.getCharacteristic(this.MESSAGE_TO_HOST_CHARACTERISTIC_UUID);

      // Enable notifications for "Message To Host" characteristic
      await this.messageToHostCharacteristic.startNotifications();
      if(this.messageToHostNotificationsRef != null){
        this.messageToHostCharacteristic.removeEventListener('characteristicvaluechanged', this.messageToHostNotificationsRef);
      }

      this.messageToHostNotificationsRef = this._handleMessageToHostNotifications.bind(this);
      this.messageToHostCharacteristic.addEventListener('characteristicvaluechanged', this.messageToHostNotificationsRef);
      //console.log('Notifications enabled for "Message To Host".');

      //console.log(`Connected to: ${this.device.name}, id: ${this.device.id}`);
      return this.device;

    } catch (error) {
      console.error('Bluetooth connection error:', error);
      this._emitObject({ Name: "OnError", Source: "OpenDevice", Data: `Error opening device: ${error.message}` });
      throw error; // Re-throw to propagate the error
    }
  }

  /**
   * @method closeDevice
   * @description
   * Stops notifications and disconnects from the BLE device.
   * Overrides the abstract method.
   * @returns {Promise<void>} A promise that resolves when the device is disconnected.
   */
  async closeDevice() {
    window.mt_device_WasOpened = false; // Global flag
    if (this.device && this.device.gatt.connected) {
      console.log('Disconnecting from device...');
      if (this.messageToHostCharacteristic) {
        try {
          await this.messageToHostCharacteristic.stopNotifications();
          if(this.messageToHostNotificationsRef != null){
            this.messageToHostCharacteristic.removeEventListener('characteristicvaluechanged', this.messageToHostNotificationsRef);
          }
          
          console.log('Notifications stopped and event listener removed.');
        } catch (error) {
          console.warn('Failed to stop notifications or remove event listener:', error);
        }
      }
      this.device.gatt.disconnect();
      this.device = null; // Clear device reference after disconnect
      this._emitObject({ Name: "OnDeviceClose", Device: null });
    }
  }

  /**
   * @method _generatePDUsForMessage
   * @param {string} applicationPayloadHex - The application message data as a hexadecimal string.
   * @description
   * Generates an array of PDUs (Protocol Data Units) from a given application message.
   * Each PDU is formatted as a Uint8Array, ready to be sent as a Bluetooth LE characteristic value.
   * @private
   * @returns {Uint8Array[]} An array of PDUs. Each PDU is a Uint8Array.
   */
  _generatePDUsForMessage(applicationPayloadHex) {
    if (!applicationPayloadHex) return [];
    let appBytes = [];
    let totalMessageLength = 0;
    let pdus = [];
    let pduCounter = 0; // PDU counter for the current message
    let bytesProcessed = 0;
    const MAX_PDU_CHARACTERISTIC_VALUE_LENGTH = 244; // Max size of the entire PDU characteristic value

    let currentPduBytesList = []; // Use a dynamic list to build PDU bytes
    let dataChunkLength = 0;
    let headerSize = 0;
    let maxDataInThisPdu = 0;
    try {
      appBytes = mt_Utils.hexToBytes(applicationPayloadHex);
      totalMessageLength = appBytes.length;
    } catch (e) {
      console.error("Error converting application payload hex to bytes:", e.message);
      return [];
    }

    // The loop must run at least once, even for an empty message (totalMessageLength === 0),
    // to generate the initial PDU with the message length.
    do {
      currentPduBytesList = [];
      // Byte 0: Message Counter
      currentPduBytesList.push(this.messageSndCounter);
      // Byte 1: PDU Counter
      currentPduBytesList.push(pduCounter);

      switch (pduCounter) {
        case 0:
          // This is the first PDU of the message
          // Byte 2: Protocol Control Byte (PCB)
          currentPduBytesList.push(0x00); // PCB is always 0 as per spec

          // Bytes 3-6: Total Message Length (Big Endian)
          currentPduBytesList.push((totalMessageLength >> 24) & 0xFF);
          currentPduBytesList.push((totalMessageLength >> 16) & 0xFF);
          currentPduBytesList.push((totalMessageLength >> 8) & 0xFF);
          currentPduBytesList.push(totalMessageLength & 0xFF);

          headerSize = 7; // MsgCtr(1) + PduCtr(1) + PCB(1) + TotalLen(4)
          maxDataInThisPdu = MAX_PDU_CHARACTERISTIC_VALUE_LENGTH - headerSize;
          dataChunkLength = Math.min(totalMessageLength - bytesProcessed, maxDataInThisPdu);

          // Append application data chunk
          for (let i = 0; i < dataChunkLength; i++) {
            currentPduBytesList.push(appBytes[bytesProcessed + i]);
          }
          break;

        default:
          // These are subsequent PDUs for the message
          headerSize = 2; // MsgCtr(1) + PduCtr(1)
          maxDataInThisPdu = MAX_PDU_CHARACTERISTIC_VALUE_LENGTH - headerSize;
          dataChunkLength = Math.min(totalMessageLength - bytesProcessed, maxDataInThisPdu);
          // Append application data chunk
          for (let i = 0; i < dataChunkLength; i++) {
            currentPduBytesList.push(appBytes[bytesProcessed + i]);
          }
          break;
      }

      bytesProcessed += dataChunkLength;
      pdus.push(new Uint8Array(currentPduBytesList));

      if (bytesProcessed >= totalMessageLength) {
        break; // All application data has been processed and put into PDUs
      }

      // Update PDU counter for the next PDU
      if (pduCounter === 0xFF) {
        pduCounter = 1; // Rolls over to 1 (0 is reserved for the first PDU)
      } else {
        pduCounter++;
      }
    } while (true); // The loop breaks when all bytes are processed
    this._updateMessageSndCounter(); // Update global message send counter
    return pdus;
  }

  /**
   * @method _updateMessageSndCounter
   * @description
   * Increments and rolls over the message send counter.
   * @private
   */
  _updateMessageSndCounter() {
    if (this.messageSndCounter === 0xFF) {
      this.messageSndCounter = 0; // Rolls over to 0
    } else {
      this.messageSndCounter++;
    }
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

export default MMSBLEDevice;
