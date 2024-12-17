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

import * as mt_Device from "./MagTek_WebAPI/API_DynamagHID.js";
import * as mt_AppSettings from "./MagTek_WebAPI/config/appsettings.js";
import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";
import * as mt_UI from "./mt_ui.js";

import "./MagTek_WebAPI/mt_events.js";

export let _openTimeDelay = 2000;
let retval = "";

document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);
document
  .querySelector("#sendCommand")
  .addEventListener("click", handleSendCommandButton);
document
  .querySelector("#clearCommand")
  .addEventListener("click", handleClearButton);
document
  .querySelector("#CommandList")
  .addEventListener("change", mt_UI.FromListToText);
document.addEventListener("DOMContentLoaded", handleDOMLoaded);

async function handleDOMLoaded() {
  mt_UI.ClearLog();
  let devices = await mt_Device.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0 ) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });

  navigator.hid.addEventListener("connect", async ({ device }) => {
    EmitObject({Name:"OnDeviceConnect", Device:device});
    if (window.mt_device_WasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
  });

  navigator.hid.addEventListener("disconnect", ({ device }) => {
    EmitObject({Name:"OnDeviceDisconnect", Device:device});
  });
};

async function handleCloseButton() {
  mt_Device.closeDevice();  
  mt_UI.ClearLog();  
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
}

async function handleOpenButton() {
  window.mt_device_hid = await mt_Device.openDevice();  
}

async function handleSendCommandButton() {
    let data = document.getElementById("sendData");
    let resp = await parseCommand(data.value);  
  }

async function parseCommand(message) {
  let Response ;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      //mt_Utils.debugLog("GETAPPVERSION " + mt_AppSettings.App.Version);
      return mt_AppSettings.App.Version;
      break;
    case "GETDEVINFO":
      //return mt_HID.getDeviceInfo();
      break;
    case "SENDCOMMAND":
      Response = await mt_Device.sendCommand(cmd[1]);
      return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();
      break;
    case "OPENDEVICE":
      window.mt_device_hid = await mt_Device.openDevice();
      break;
    case "CLOSEDEVICE":
      window.mt_device_hid = await mt_Device.closeDevice();        
      break;
    case "WAIT":
      mt_UI.LogData(`Waiting ${cmd[1]/1000} seconds...`);
      await mt_Utils.wait(cmd[1]);
      mt_UI.LogData(`Done Waiting`);
      break;
    case "DETECTDEVICE":
      await mt_Device.closeDevice();
      window.mt_device_hid = await mt_Device.openDevice();      
      await mt_Utils.wait(_openTimeDelay);
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);mt
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);
      mt_UI.LogData(`Get Tags for ${retval}`);      
      break;
    case "PARSETLV":
      retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "UPDATEPROGRESS":
      mt_UI.updateProgressBar(cmd[1],cmd[2])  
      break;
    default:
      mt_UI.LogData(`Unknown Parse Command: ${cmd[0]}`);    
  }
}


function ClearAutoCheck() {
  let chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

const deviceConnectLogger = (e) => {
  mt_UI.setUSBConnected("Connected");
};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
};
const deviceOpenLogger = (e) => {  
  mt_UI.setUSBConnected("Opened");
};



const fromV5DeviceLogger = (e) => {
  mt_UI.LogData(`V5 Device Response: ${e.Data}`);
};

const inputReportLogger = (e) => {
  mt_UI.LogData(`Input Report: ${e.Data}`);
};

const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};

const V5MSRSwipeLogger = (e) =>{
  mt_UI.LogData(`MSR Swiped ${e.Name}`);
  mt_UI.LogData(`${JSON.stringify(e.Data,null, 2)}`);  
}

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}

// Subscribe to  events
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);
EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);
EventEmitter.on("OnError", errorLogger);
EventEmitter.on("OnV5DeviceResponse", fromV5DeviceLogger);
EventEmitter.on("OnV5MSRSwipe", V5MSRSwipeLogger);
//EventEmitter.on("OnInputReport", inputReportLogger);
