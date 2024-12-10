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
import * as MT_Parse from "./API_ID5G3Parse.js";
import * as mt_Configs from "./config/DeviceConfig.js";

let mtDeviceType = "";
let _devinfo = "";



var appOptions = {
  responseDelay: 5,
};




function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}

export async function getDeviceList() {
  let devices = await navigator.hid.getDevices();
  return devices;
}


Array.prototype.zeroFill = function (len) {
  for (var i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};

function buildCmdArray(commandstring, reportLen) {
  var cmdArray = mt_Utils.hexToBytes(commandstring).zeroFill(reportLen);
  return new Uint8Array(cmdArray);
}

function getExtendedCommandArray(commandStr, dataStr) {
  var command = mt_Utils.hexToBytes(commandStr);
  var data = mt_Utils.hexToBytes(dataStr);
  var result = [];
  const MAX_DATA_LEN = 60;
  var commandLen = 0;
  var dataLen = 0;
  if (command != null) {
    commandLen = command.length;
  }
  if (commandLen != 2) {
    return null;
  }
  if (data != null) {
    dataLen = data.length;
  }
  var offset = 0;
  while (offset < dataLen || dataLen == 0) {
    var len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    var extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    var i;
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
  var command = mt_Utils.hexToBytes(commandStr);
  var result = [];
  const MAX_DATA_LEN = 60;
  var dataLen = parseInt(commandStr.substring(4, 8), 16);
  var offset = 0;
  while (offset < dataLen || dataLen == 0) {
    var len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    var extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    var i;
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
    var msgComplete = true;
    var extendedResponse = "";
    var cmds = getExtendedCommandArray(cmdNumber, cmdData);
    for (var index = 0; index < cmds.length; index++) {
      var deviceResponse = await sendDeviceCommand(cmds[index]);
      var rc = deviceResponse.substring(2, 4);
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
    var index;
    var msgComplete = true;
    var extendedResponse = "";
    var cmds = getExtCommandArray(cmdData);
    for (index = 0; index < cmds.length; index++) {
      
      var deviceResponse = await sendDeviceCommand(cmds[index]);      
      var rc = deviceResponse.substring(0, 2);
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
  } catch (error) {
    throw error;
  }
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
  } 
  catch (error) 
  {
    return error;
  }
}


async function sendDeviceCommand(cmdToSend) {
  return new Promise(async (resolve, reject) => {
    try {
            
      var cmdInput = buildCmdArray(cmdToSend, _devinfo.ReportLen);
      var numBytes = await window.mt_device_hid.sendFeatureReport(_devinfo.ReportID, cmdInput);
      let dv = await getDeviceResponse();
      resolve(dv);
    } 
    catch (error) 
    {
      reject(error);
    }
  });
}

async function getDeviceResponse() {
  return new Promise((resolve, reject) => {
    setTimeout(async function () {
      try {
        var DataView = await window.mt_device_hid.receiveFeatureReport(_devinfo.ReportID);
        var FP = new Uint8Array(DataView.buffer);
        var RT = null;
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
        mt_Utils.debugLog("Error thrown " + err);
        reject(
          EmitObject({
            Name: "OnError",
            Source: "getDeviceResponse",
            Data: err.message,
          })
        );
      }
    }, appOptions.responseDelay);
  });
}

  export async function openDevice() {
    try {
    let reqDevice;    
    let devices = await navigator.hid.getDevices();
    let device = devices.find((d) => d.vendorId === mt_Configs.vendorId);

    if (!device) {
      reqDevice = await navigator.hid.requestDevice({ filters: mt_Configs.ID5G3filters});
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
          case "ID5G3":
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
    var packetArray = [];
    var dataArray = new Uint8Array(e.data.buffer);
    packetArray[0] = e.reportId;
    packetArray.push(...dataArray);
    let data = mt_Utils.toHexString(dataArray);
    
    EmitObject({Name: "OnInputReport", Data: data});

    switch (mtDeviceType) {
      case "CMF":
        EmitObject({Name: "OnError",
          Source: "DeviceType",
          Data: "Not Implemented"
        });
        break;
      case "MMS":
        EmitObject({Name:"OnError",
          Source: "DeviceType",
          Data: "Use the MMS Parser"
        });
        break;
      case "ID5G3":
        MT_Parse.parseID5G3Packet(packetArray);
        break;
        default:
        EmitObject({Name: "OnError", Source: "DeviceType", Data: "Unknown Device Type" });
        break;
    }
  }