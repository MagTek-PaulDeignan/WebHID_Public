// device_factory.js
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

// Import all concrete device classes
import MMSWebSocketDevice from "./API_device_mmsWebSocket.js";
import MMSBLEDevice from "./API_device_mmsBLE.js";
import MMSHIDDevice from "./API_device_mmsHID.js";
import MMSMQTTDevice from "./API_device_mmsMQTT.js";
import MMSSerialDevice from "./API_device_mmsSerial.js";

/**
 * @class DeviceFactory
 * @description
 * A static factory class responsible for creating instances of various device communication
 * classes based on a specified type. This centralizes object creation and decouples
 * the client code from concrete device implementations.
 */
class DeviceFactory {
  /**
   * @static
   * @method getDevice
   * @param {string} type - The type of device to create (e.g., "WEBSOCKET", "BLE", "HID", "MQTT", "SERIAL").
   * @returns {AbstractDevice} An instance of the requested concrete device class.
   * @throws {Error} If an unsupported device type is requested.
   */
  static getDevice(type) {
    switch (type.toUpperCase()) {
      case "MMS_WEBSOCKET":
        return new MMSWebSocketDevice();
      case "MMS_BLE":
        return new MMSBLEDevice();
      case "MMS_HID":
        return new MMSHIDDevice();
      case "MMS_MQTT":
        return new MMSMQTTDevice();
      case "MMS_SERIAL":
        return new MMSSerialDevice();
      default:
        throw new Error(`Unsupported device type: ${type}. Available types are MMS_WEBSOCKET, MMS_BLE, MMS_HID, MMS_MQTT, MMS_SERIAL.`);
    }
  }
}

export default DeviceFactory;
