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

import * as mt_Utils from "./mt_utils.js";
import * as mt_MMS from "./API_mmsParse.js";
import * as mt_Configs from "./config/DeviceConfig.js";
import "./mt_events.js";


let _filters = mt_Configs.MMSfilters;

let mtDeviceType = "";

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}

export async function getDeviceList() {
  let devices = await navigator.hid.getDevices();
  devices = mt_Configs.filterDevices(devices, _filters);
  return devices;
}

export async function sendCommand(cmdToSend) {
  let cmdResp = "";
  window.mt_device_response = null;
  try {
    if (window.mt_device_hid == null) {
      EmitObject({
        Name: "OnError",
        Source: "SendCommand",
        Data: "Device is null",
      });
      return 0;
    }
    if (!window.mt_device_hid.opened) {
      EmitObject({
        Name: "OnError",
        Source: "SendCommand",
        Data: "Device is not open",
      });
      return 0;
    }
    cmdResp = await sendMMSCommand(mt_Utils.removeSpaces(cmdToSend));
    return cmdResp;
  } catch (error) {
    EmitObject({ Name: "OnError", Source: "SendCommand", Data: error });
    return error;
  }
}


async function sendMMSCommand(cmdToSend) {
  let commands = mt_MMS.buildCmdsArray(
    cmdToSend,
    window.mt_device_hid.collections[0].outputReports[0].items[0].reportCount
  );
  for (let index = 0; index < commands.length; index++) {
    await window.mt_device_hid.sendReport(0, new Uint8Array(commands[index]));
  }
  Response = await waitForDeviceResponse();
  return Response;
};

function waitForDeviceResponse() {
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

export async function GetDeviceSN(){
  let resp = await sendCommand("AA0081040100D101841AD10181072B06010401F609850102890AE208E106E104E102C100");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false) ;
  let data = mt_Utils.getTagValue("C1","",tag89, false);
  return data.substring(0,7);
}

export async function GetDeviceFWID(){
  let resp = await sendCommand("AA0081040102D101841AD10181072B06010401F609850102890AE108E206E204E202C200");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false);
  let data = mt_Utils.getTagValue("C2","",tag89, true);
  return data;
}

export async function openDevice() {
  try {
    let reqDevice;
    let devices = await getDeviceList();    
    let device = devices.find((d) => d.vendorId === mt_Configs.vendorId);
    
      if (!device) {
      reqDevice = await navigator.hid.requestDevice({filters: _filters });
      if(reqDevice != null)
        {
          if (reqDevice.length > 0)
          {
            device = reqDevice[0];
          }
        }
    }
    if (!device.opened) {
      await device.open();
      device.addEventListener("inputreport", handleInputReport);      
    }
    if (device.opened) {
      window.mt_device_WasOpened = true;      
      let _devinfo = mt_Configs.getHIDDeviceInfo(device.productId);
      mtDeviceType = _devinfo.DeviceType;

      switch (mtDeviceType) {
        case "MMS":
          EmitObject({Name:"OnDeviceOpen", Device:device});
          break;
        case "V5":
          EmitObject({Name:"OnDeviceOpen", Device:device});
          break;
        default:
          EmitObject({Name:"OnError",
            Source: "Bad DeviceType",
            Data: `Use the ${mtDeviceType} Parser`
          });
          break;
      }      
    }
    return device;
  } catch (error) {
    EmitObject({Name:"OnError",
      Source: "OpenDevice",
      Data: "Error opening device",
    });
  }
};

export async function closeDevice(){
  window.mt_device_WasOpened = false;
  if (window.mt_device_hid != null) {
    await window.mt_device_hid.close();
    EmitObject({Name:"OnDeviceClose", Device:window.mt_device_hid});
  }
};

function handleInputReport(e) {
  let dataArray = new Uint8Array(e.data.buffer);
  switch (mtDeviceType) {
    case "CMF":
      EmitObject({Name:"OnError",
        Source: "DeviceType",
        Data: "Not Implemented"
      });
      break;
    case "MMS":      
      mt_MMS.parseMMSPacket(dataArray);
      break;
    case "V5":
      mt_V5.parseV5Packet(dataArray);
      break;
    default:
      EmitObject({Name:"OnError",
        Source: "DeviceType",
        Data: "Unknown Device Type",
      });
      break;
  }
};



Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};
