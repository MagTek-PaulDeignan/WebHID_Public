/* 
DO NOT REMOVE THIS COPYRIGHT
 Copyright 2020-2024 MagTek, Inc, Paul Deignan.
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as mt_MMS from "./mt_mms.js";
import * as mt_HID from "./mt_hid.js";
import * as mt_MQTT from "./mmsMQTT_API.js";

var _Transport = "HID";
var _Type = "MMS";


/**
 * @param {string} name
 */
export function setTransport(name) {
    _Transport = name;
};
  
/**
 * @param {string} name
 */
export function setType(name) {
    _Type = name;
};


export async function OpenDevice() 
{
    switch (`${_Type.toLowerCase()}_${_Transport.toLowerCase()}`) {
        case "mms_wss":
            
            break;
        case "mms_mqtt":
            await mt_MQTT.OpenMQTT();
            break;
        case "mms_hid":
            await mt_HID.openDevice();;
            break;
        default: 
            break;
    }
};
  
export async function CloseDevice()
{
    switch (`${_Type.toLowerCase()}_${_Transport.toLowerCase()}`) {
        case "mms_wss":
            break;
        case "mms_mqtt":
            await mt_MQTT.CloseMQTT();
            break;
        case "mms_hid":
            await mt_HID.closeDevice();
            break;
        default: 
            break;
    }
};

export async function SendCommand(command)
{
switch (_Transport.toLowerCase()) {
    case "mms_wss":
        break;
    case "mms_mqtt":
        break;
    case "mms_hid":
        break;
    case "mms_ble":
        break;
    default: 
        
        break;
}
};