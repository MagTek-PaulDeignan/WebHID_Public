// device_mmsMQTT.js
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

import * as mt_MMS from "../API_mmsParse.js";
import * as mt_AppSettings from "../config/appsettings.js"; // Assuming this file exists and contains MQTT settings
import mqtt from "../mqtt.esm.js"; // Assuming mqtt.esm.js is the MQTT client library
import AbstractDevice from "./API_device_abstract.js";
import * as mt_Utils from "../mt_utils.js";

/**
 * @class MMSMQTTDevice
 * @augments AbstractDevice
 * @description
 * Implements device communication over MQTT, adhering to the AbstractDevice interface.
 */
class MMSMQTTDevice extends AbstractDevice {
  /**
   * @constructor
   * @description
   * Initializes MQTT-specific connection parameters.
   */
  constructor() {
    super(); // Call the parent constructor
    this.type = "MMS_MQTT";
    this._url = ""; // MQTT broker URL
    this._devPath = ""; // Device topic path
    this._userName = ""; // MQTT username for authentication
    this._password = ""; // MQTT password for authentication
    this._client = null; // Holds the MQTT client instance
  }

  /**
   * @method setURL
   * @param {string} URL - The MQTT broker URL (e.g., "mqtt://broker.example.com").
   * @description
   * Sets the MQTT broker URL.
   */
  setURL(URL) {
    this._url = URL;
  }

  /**
   * @method setPath
   * @param {string} Path - The base topic path for device communication.
   * @description
   * Sets the device's MQTT topic path.
   */
  setPath(Path) {
    this._devPath = Path;
  }

  /**
   * @method setUserName
   * @param {string} UserName - The username for MQTT authentication.
   * @description
   * Sets the MQTT username. If empty string, sets to null.
   */
  setUserName(UserName) {
    this._userName = UserName;
    if (UserName != null && UserName.length === 0) {
      this._userName = null;
    }
  }

  /**
   * @method setPassword
   * @param {string} Password - The password for MQTT authentication.
   * @description
   * Sets the MQTT password. If empty string, sets to null.
   */
  setPassword(Password) {
    this._password = Password;
    if (Password != null && Password.length === 0) {
      this._password = null;
    }
  }


  /**
   * @method sendCommand
   * @param {string} cmdHexString - The command in hexadecimal string format.
   * @description
   * Publishes a command to the MQTT device topic, checking command mode.
   * Overrides the abstract method.
   * @returns {Promise<any>} A promise that resolves with the device response.
   */
  async sendCommand(cmdHexString) {
    if (!this._activeCommandMode) {
      this._emitObject({
        Name: "OnError",
        Source: "SendCommand",
        Data: "Session not active",
      });
      return Promise.reject("Session not active");
    }
    window.mt_device_response = null; // Global response, as per original structure
    if (this._client && this._client.connected) {
      // Assuming mt_AppSettings.MQTT.MMS_Base_Sub provides the base for subscription topics
      // and commands are sent to a sub-topic of the device path.
      this._client.publish(`${mt_AppSettings.MQTT.MMS_Base_Sub}${this._devPath}/MMSMessage`, cmdHexString);
      let Resp = await this._waitForDeviceResponse();
      return Resp;
    } else {
      this._emitObject({ Name: "OnError", Source: "SendCommand", Data: "MQTT client not connected." });
      return Promise.reject("MQTT client not connected.");
    }
  }


  /**
   * @method openDevice
   * @description
   * Establishes a connection to the MQTT broker and subscribes to necessary topics.
   * Overrides the abstract method.
   * @returns {Promise<mqtt.MqttClient>} A promise that resolves with the MQTT client instance.
   */
  async openDevice() {
    if (this._client == null || !this._client.connected) {
      let options = {
        clean: true, // Clean session
        connectTimeout: 4000, // Connection timeout in ms
        clientId: `MagTekClient-${mt_Utils.makeid(6)}`, // Unique client ID
        username: this._userName,
        password: this._password
      };

      this._client = mqtt.connect(this._url, options);
      // Bind event handlers to the class instance
      this._client.on('connect', this._onMQTTConnect.bind(this));
      this._client.on('message', this._onMQTTMessage.bind(this));
      this._client.on('error', this._checkMQTTError.bind(this)); // Add error listener
    }
    return this._client;
  }

  /**
   * @method closeDevice
   * @description
   * Disconnects from the MQTT broker.
   * Overrides the abstract method.
   * @returns {Promise<void>} A promise that resolves when the MQTT client is disconnected.
   */
  async closeDevice() {
    if (this._client && this._client.connected) {
      // Unsubscribe from topics before ending
      if (this._devPath.length > 0) {
        await this._client.unsubscribe(`${mt_AppSettings.MQTT.MMS_Base_Pub}${this._devPath}/MMSMessage`);
      }
      await this._client.unsubscribe(`${mt_AppSettings.MQTT.MMS_DeviceList}`);

      // Clear event listeners
      this._client.removeAllListeners('connect');
      this._client.removeAllListeners('message');
      this._client.removeAllListeners('error');
      
      await this._client.end(); // Disconnect the client
      this._client = null; // Clear client instance
    }
    this._emitObject({ Name: "OnDeviceClose", Device: null });
  }

  /**
   * @method _onMQTTConnect
   * @param {object} _connack - The MQTT connection acknowledgment object.
   * @description
   * Handles the MQTT 'connect' event, subscribing to necessary topics.
   * @private
   */
  async _onMQTTConnect(_connack) {
    if (this._client != null && this._client.connected) {
      // Subscribe to device-specific message topic if a path is set
      if (this._devPath.length > 0) {
        // Ensure to handle subscription errors
        this._client.subscribe(`${mt_AppSettings.MQTT.MMS_Base_Pub}${this._devPath}/MMSMessage`, this._checkMQTTError.bind(this));
      }
      // Subscribe to general device list topic
      this._client.subscribe(`${mt_AppSettings.MQTT.MMS_DeviceList}`, this._checkMQTTError.bind(this));
      
      if(this._devPath.length > 0){
          //this._emitObject({ Name: "OnDeviceOpen", Device: this._client }); // Signal device is "open" (connected)
      }
      
    }
  }

  /**
   * @method _checkMQTTError
   * @param {Error} err - The MQTT error object.
   * @description
   * Handles MQTT errors, emitting an 'OnError' event.
   * @private
   */
  _checkMQTTError(err) {
    if (err) {
      console.error("MQTT Error:", err);
      this._emitObject({
        Name: "OnError",
        Source: "MQTTError",
        Data: err.message || err.toString()
      });
    }
  }

  /**
   * @method _onMQTTMessage
   * @param {string} topic - The MQTT topic the message was received on.
   * @param {Buffer} message - The message payload.
   * @description
   * Handles incoming MQTT messages, parsing based on topic.
   * @private
   */
  _onMQTTMessage(topic, message) {
    let data = "";
    let topicArray = topic.split('/');
    if (topicArray.length >= 5) {
      switch (topicArray[topicArray.length - 1]) {
        case "Status":
          data = message.toString();
          this._emitObject({ Name: "OnMQTTStatus", Data: { Topic: topic, Message: data } });
          // Check if the status is for the current device path
          if (`${topicArray[topicArray.length - 3]}/${topicArray[topicArray.length - 2]}` === this._devPath) {
            if (data.toLowerCase() === "connected") {
              if (this._client) {
                // If a specific device connected status is received for our path
                //this._emitObject({ Name: "OnDeviceConnect", Device: this._client });
                this._emitObject({ Name: "OnDeviceOpen", Device: this._client });
              } else {
                // Handle case where client might be null unexpectedly
                this._emitObject({ Name: "OnDeviceConnect", Device: null });
              }
            } else {
              this._emitObject({ Name: "OnDeviceDisconnect", Device: null });
            }
          }
          break;
        case "MMSMessage":
          if (message) {
            // Check if message is binary (0xAA prefix) or ASCII (hex string)
            if (message[0] === 0xAA) { // 170 decimal = 0xAA
              mt_MMS.ParseMMSMessage(message); // Process binary message
            } else {
              mt_MMS.ParseMMSMessage(mt_Utils.hexToBytes(message.toString())); // Convert ASCII hex string to bytes
            }
          }
          break;
        default:
          console.log(`Unhandled MQTT message on topic ${topic}: ${message.toString()}`);
          break;
      }
    }
  }

  /**
   * @method PrintData
   * @param {string} Path - The MQTT topic path to publish to.
   * @param {string} JSONData - The JSON data to print.
   * @description
   * A specific utility function to publish data for printing.
   * (Marked as "Temporary - in Dev" in original, kept as-is)
   * @returns {Promise<boolean>} A promise that resolves to true on successful publish.
   */
  async PrintData(Path, JSONData) {
    if (this._client && this._client.connected) {
      this._client.publish(`${Path}/Print`, JSONData);
      return true;
    } else {
      console.warn("Cannot print data: MQTT client not connected.");
      return false;
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

}

export default MMSMQTTDevice;
