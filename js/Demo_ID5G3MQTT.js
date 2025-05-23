/* 
DO NOT REMOVE THIS COPYRIGHT
 Copyright 2020-2025 MagTek, Inc, Paul Deignan.
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";
import * as mt_UI from "./mt_ui.js";

import * as mt_RMS_API from "./MagTek_WebAPI/API_rms.js";
import * as mt_MQTT_API from "./MagTek_WebAPI/API_ID5G3MQTT.js";
import "./MagTek_WebAPI/mt_events.js";

import * as mt_Parse from "./MagTek_WebAPI/API_ID5G3Parse.js";

let retval = "";

let url = mt_Utils.getEncodedValue('MQTTURL','d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==');
let devPath = mt_Utils.getEncodedValue('MQTTDevice','');
let userName = mt_Utils.getEncodedValue('MQTTUser','RGVtb0NsaWVudA==');
if (userName.length == 0 ) userName = null;

let password = mt_Utils.getEncodedValue('MQTTPassword','ZDNtMENMdjFjMQ==');
if (password.length == 0 ) password = null;


const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.devpath;
if (value != null) {
  devPath = value;
}

export let _openTimeDelay = 1500;

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

document.getElementById('fileInput')
  .addEventListener('change', handleFileUpload);
  
document.addEventListener("DOMContentLoaded", handleDOMLoaded);

async function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();
}


async function handleCloseButton() {
  await mt_MQTT_API.CloseMQTT();
  mt_UI.ClearLog();
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  window.mt_device_ARQCData = null;
  document.getElementById("fileInput").value = null;
}


async function handleOpenButton() {
  mt_MQTT_API.setURL(url);
  mt_MQTT_API.setUserName(userName);
  mt_MQTT_API.setPassword(password);
  mt_MQTT_API.setPath(devPath);  
  mt_MQTT_API.OpenMQTT();
}

async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}

async function parseCommand(message) {
  let Response = "";
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      //mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      //mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      mt_MQTT_API.SendCommand(cmd[1]);
      break;
    case "SENDCOMMANDCMAC":
      await mt_MQTT_API.sendCommandCMAC(cmd[1]);
      //Response = await mt_MQTT_API.sendCommandCMAC(cmd[1]);
      //return EmitObject({ Name: "OnID5DeviceResponse", Data: Response });
      break;
    case "SENDDATETIME":
      //Response = await mt_MQTT_API.SendCommand(mt_V5.calcDateTime()); 
      //return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "SENDEXTENDEDCOMMAND":
      //Response = await mt_V5.sendExtendedCommand(cmd[1], cmd[2]);
      //return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "SENDEXTCOMMAND":
      //Response = await mt_V5.sendExtCommand(cmd[1]);
      //return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;  
    case "PCIRESET":
      mt_MQTT_API.SendCommand("02000000");      
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":      
      mt_MQTT_API.OpenMQTT();
      break;
    case "CLOSEDEVICE":      
    mt_MQTT_API.CloseMQTT();
      break;
    case "WAIT":
      mt_UI.LogData(`Waiting ${cmd[1]/1000} seconds...`);
      await mt_Utils.wait(cmd[1]);      
      break;
    case "DETECTDEVICE":
      //window._device = await mt_MMS.openDevice();      
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);
      mt_UI.LogData(retval);
      break;
    case "PARSETLV":
      retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    case "PROCESS_SALE": 
      handleProcessSale();
      break;
    case "GETDEVICESN":
      let sn = await mt_MQTT_API.GetDeviceSN();
      mt_UI.LogData(sn);
      break;
    case "GETFIRMWAREID":
      let fw = await mt_MQTT_API.GetDeviceFWID();
      mt_UI.LogData(fw);
      break;
    default:
      mt_UI.LogData("Unknown Command");
  }
};


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
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const trxCompleteLogger = (e) => {
  mt_UI.LogData(`${e.Name}: ${e.Data}`);
};

const debugLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};

const fileLogger = (e) => {
  mt_UI.LogData(`File: ${e.Data.HexString}`);
};

const mqttStatus = (e) => {
  let topicArray = e.Data.Topic.split('/');
  let data = e.Data.Message;
  mt_UI.AddDeviceLink(topicArray[topicArray.length-3], `${topicArray[topicArray.length-2]}`,data, `${window.location.pathname}?devpath=${topicArray[topicArray.length-3]}/${topicArray[topicArray.length-2]}`);
}

async function handleFileUpload(event) {
  if( event.target.files.length ==1 )
  {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async function(e) {
      const lines = e.target.result.split('\n');
      for (const line of lines) 
        {
        await parseCommand(line);
        }
    };
  reader.readAsText(file); 
};
}



const DeviceResponseLogger = (e) => {
   //mt_UI.LogData(`Device Response: ${e.Data}`);
   let resp = mt_Parse.parseID5Response(e.Data)
   mt_UI.LogData(`Device Response: ${JSON.stringify(resp,null,2)}`);
   
};
const inputReportLogger = (e) => {
  mt_UI.LogData(`Input Report: ${e.Data}`);
};

const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};

const ID5MSRSwipeLogger = (e) =>{
  mt_UI.LogData(`ID5 MSR Swiped ${e.Name}`);
  mt_UI.LogData(`${JSON.stringify(e.Data,null, 2)}`);  
}

const QwantumSwipe = (e) =>{
  mt_UI.LogData(`Qwantum Swiped ${e.Name}`);
  mt_UI.LogData(`${JSON.stringify(e.Data,null, 2)}`);  
}



const QwantumPush = (e) =>{
  mt_UI.LogData(`Qwantum Push`);
  mt_UI.LogData(`${JSON.stringify(e.Data,null, 2)}`);
}

// Subscribe to  events
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);
EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);
EventEmitter.on("OnDeviceResponse", DeviceResponseLogger);
EventEmitter.on("OnError", errorLogger);
EventEmitter.on("OnMQTTStatus", mqttStatus);
EventEmitter.on("OnID5MSRSwipe", ID5MSRSwipeLogger);
EventEmitter.on("OnQwantumSwipe", QwantumSwipe);
EventEmitter.on("OnQwantumPush", QwantumPush);
