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
"use strict";
import * as mt_Utils from "./mt_utils.js";
import * as MT_Parse from "./API_v5Parse.js";
import * as mt_Configs from "./config/DeviceConfig.js";
import * as mt_AppSettings from "./config/appsettings.js";

let _filters = mt_Configs.V5filters;

let mtDeviceType = "";
let _devinfo = "";


function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}

export async function getDeviceList() {
  let devices = await navigator.hid.getDevices();
  devices = mt_Configs.filterDevices(devices, _filters);
  return devices;
}


Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};

function buildCmdArray(commandstring, reportLen) {
  let cmdArray = mt_Utils.hexToBytes(commandstring).zeroFill(reportLen);
  return new Uint8Array(cmdArray);
}

export function calcDateTime() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const year = now.getFullYear() - 2008;
  const dateTimeString =
    mt_Utils.makeHex(month, 2) +
    mt_Utils.makeHex(day, 2) +
    mt_Utils.makeHex(hour, 2) +
    mt_Utils.makeHex(minute, 2) +
    mt_Utils.makeHex(second, 2) +
    "00" +
    mt_Utils.makeHex(year, 2);
    const command =
    "491E0000030C00180000000000000000000000000000000000" + dateTimeString;
  return command;
}

function getExtendedCommandArray(commandStr, dataStr) {
  let command = mt_Utils.hexToBytes(commandStr);
  let data = mt_Utils.hexToBytes(dataStr);
  let result = [];
  const MAX_DATA_LEN = 60;
  let commandLen = 0;
  let dataLen = 0;
  if (command != null) {
    commandLen = command.length;
  }
  if (commandLen != 2) {
    return null;
  }
  if (data != null) {
    dataLen = data.length;
  }
  let offset = 0;
  while (offset < dataLen || dataLen == 0) {
    let len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    let extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    let i;
    for (i = 0; i < len; i++) {
      extendedCommand[8 + i] = data[offset + i];
    }
    offset += len;
    result.push(mt_Utils.toHexString(extendedCommand));

    if (dataLen == 0) break;
  }
  return result;
}

function getExtCommandArray(commandStr) {
  let command = mt_Utils.hexToBytes(commandStr);
  let result = [];
  const MAX_DATA_LEN = 60;
  let dataLen = parseInt(commandStr.substring(4, 8), 16);
  let offset = 0;
  while (offset < dataLen || dataLen == 0) {
    let len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    let extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    let i;
    for (i = 0; i < len; i++) {
      extendedCommand[8 + i] = command[4 + offset + i];
    }
    offset += len;
    result.push(mt_Utils.toHexString(extendedCommand));

    if (dataLen == 0) break;
  }
  return result;
}

export async function sendExtendedCommand(cmdNumber, cmdData) {
  try {
    let deviceResponse = "";
    let rc = "";
    let msgComplete = true;
    let extendedResponse = "";
    let cmds = getExtendedCommandArray(cmdNumber, cmdData);
    for (let index = 0; index < cmds.length; index++) {
      deviceResponse = await sendDeviceCommand(cmds[index]);
      rc = deviceResponse.substring(2, 4);
      switch (rc) {
        case "0A": //more data is available
          extendedResponse = parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B": //buffering data
          msgComplete = true;
          extendedResponse = deviceResponse;
          break;
        default:
          msgComplete = true;
          extendedResponse = deviceResponse;
      }
    }

    while (!msgComplete) {
      //we need to get more data...
      deviceResponse = await sendDeviceCommand("4A00");
      rc = deviceResponse.substring(2, 4);
      switch (rc) {
        case "0A":
          extendedResponse = parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B":
          extendedResponse = deviceResponse;
          break;
        default:          
          extendedResponse = deviceResponse;
      }
    }
    return  extendedResponse;
  } catch (error) {
    return error;
  }
}

export async function sendExtCommand(cmdData) {
  try {
    let deviceResponse = "";
    let rc = "";
    let index;
    let msgComplete = true;
    let extendedResponse = "";
    let cmds = getExtCommandArray(cmdData);
    for (index = 0; index < cmds.length; index++) {
      
      deviceResponse = await sendDeviceCommand(cmds[index]);      
      rc = deviceResponse.substring(0, 2);
      switch (rc) {
        case "0A": //more data is available
          extendedResponse = MT_Parse.parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B": //buffering data
          msgComplete = true;
          extendedResponse = deviceResponse;
          break;
        default:
          msgComplete = true;
          extendedResponse = deviceResponse;
      }
    }

    while (!msgComplete) {
      //we need to get more data...
      deviceResponse = await sendDeviceCommand("4A00");
      rc = deviceResponse.substring(0, 2);
      switch (rc) {
        case "0A":
          extendedResponse = MT_Parse.parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B":
          extendedResponse = deviceResponse;
          break;
        default:
          extendedResponse = deviceResponse;
      }
    }
    return extendedResponse;
  } 
  catch (error) 
  {
    throw error;
  }
}

export async function getBLEFWID() {
  let ret = await sendCommand("460401000000");
  if(ret.substring(0,2) != "00") return "";
  let data = ret.substring(10);
  let dl = mt_Utils.makeHex(data.length);
  return `00${dl}${data}`;

}
export async function sendCommand(cmdToSend) {
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
    
    const Response = await sendDeviceCommand(cmdToSend);
    return Response;
  } catch (error) {
    return error;
  }
}


async function sendDeviceCommand(cmdToSend) {
  return new Promise(async (resolve, reject) => {
    try {
            
      let cmdInput = buildCmdArray(cmdToSend, _devinfo.ReportLen);
      let numBytes = await window.mt_device_hid.sendFeatureReport(_devinfo.ReportID, cmdInput);
      let dv = await getDeviceResponse();
      resolve(dv);
    } catch (error) {
      reject(error);
    }
  });
}

async function getDeviceResponse() {
  return new Promise((resolve, reject) => {
    setTimeout(async function () {
      try {
        let DataView = await window.mt_device_hid.receiveFeatureReport(_devinfo.ReportID);
        let FP = new Uint8Array(DataView.buffer);
        let RT = null;
        switch (_devinfo.ReportID) {
          case 0:
            RT = FP.slice(0, FP[1] + 2);
            break;
          default:
            RT = FP.slice(1, FP[2] + 3);
            break;
        }

        resolve(mt_Utils.toHexString(RT));
      } catch (err) {
        //mt_Utils.debugLog("Error thrown " + err);
        reject(
          EmitObject({
            Name: "OnError",
            Source: "getDeviceResponse",
            Data: err.message,
          })
        );
      }
    }, mt_AppSettings.App.ResponseDelay);
  });
}

  export async function openDevice() {
    try {
    let reqDevice;    
    let devices = await getDeviceList();
    let device = devices.find((d) => d.vendorId === mt_Configs.vendorId);

    if (!device) {
      reqDevice = await navigator.hid.requestDevice({ filters: _filters});
      if(reqDevice != null)
        {
          if (reqDevice.length> 0)
          {
            device = reqDevice[0];
          }
        }
    }
      
      if (!device.opened) {        
        device.addEventListener("inputreport", handleInputReport);
        await device.open();
      }
      if (device.opened) {
        window.mt_device_WasOpened = true;        
        _devinfo = mt_Configs.getHIDDeviceInfo(device.productId);
        mtDeviceType = _devinfo.DeviceType;
  
        switch (mtDeviceType) {
          case "V5":
            EmitObject({Name:"OnDeviceOpen", 
              Device:device
            });
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
    } 
    catch (error) 
    {
      EmitObject({Name:"OnError",
        Source: "OpenDevice",
        Data: `Error opening device: ${error.message}`,
      });
    }
  };
  export async function closeDevice(){
    window.mt_device_WasOpened = false;
  if (window.mt_device_hid != null) {
    await window.mt_device_hid.close();
    EmitObject({Name: "OnDeviceClose", Device: window.mt_device_hid});
  }
  };

  function handleInputReport(e) {
    let packetArray = [];
    let dataArray = new Uint8Array(e.data.buffer);
    packetArray[0] = e.reportId;
    packetArray.push(...dataArray);
    //let data = mt_Utils.toHexString(dataArray);
    //mt_Utils.debugLog(`Here is the Input Report: ${data}`)
    switch (mtDeviceType) {
      case "CMF":
        EmitObject({Name: "OnError", Source: "DeviceType", Data: "Not Implemented"});
        break;
      case "MMS":
        EmitObject({Name:"OnError", Source: "DeviceType", Data: "Use the MMS Parser"});
        break;
      case "V5":
        MT_Parse.parseV5Packet(packetArray);
        break;
        default:
        EmitObject({Name: "OnError", Source: "DeviceType", Data: "Unknown Device Type"});
        break;
    }
  }