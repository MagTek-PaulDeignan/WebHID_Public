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
import * as mt_MMS from "./mt_mms.js";
import * as mt_HID from "./mt_hid.js";
import * as mt_UI from "./mt_ui.js";
import mqtt  from "./mqtt.esm.js";
import "./mt_events.js";

let url = mt_Utils.getDefaultValue('MQTTURL','wss://hd513d49.ala.us-east-1.emqxsl.com:8084/mqtt');
let devPath = mt_Utils.getDefaultValue('MQTTDevice','');
let userName = mt_Utils.getDefaultValue('MQTTUser','testDevice1');
let password = mt_Utils.getDefaultValue('MQTTPassword','t3stD3v1c1');

let client = null;
export let _openTimeDelay = 1500;

document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);
document
  .addEventListener("DOMContentLoaded", handleDOMLoaded);

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

async function handleDOMLoaded() {
  let devices = await mt_HID.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });


  //Add the hid event listener for connect/plug in
  navigator.hid.addEventListener("connect", async ({ device }) => {
    EmitObject({Name:"OnDeviceConnect", Device:device});
    if (mt_MMS.wasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
  });

  //Add the hid event listener for disconnect/unplug
  navigator.hid.addEventListener("disconnect", ({ device }) => {
    EmitObject({Name:"OnDeviceDisconnect", Device:device});
  });

  await mt_Utils.wait(_openTimeDelay);
  await handleOpenButton();

}

async function handleCloseButton() {
  mt_MMS.closeDevice();
  mt_UI.ClearLog();
  CloseMQTT();
}
// async function handleClearButton() {
//   mt_UI.ClearLog();
// }

async function handleOpenButton() {
  mt_UI.ClearLog();
  CloseMQTT();
  mt_MMS.closeDevice();
  window._device = await mt_MMS.openDevice();
  let devSN = await GetDevSN();
  devPath = `${mt_Utils.filterString(window._device.productName)}/${mt_Utils.filterString(devSN)}`;
  OpenMQTT();
}

async function GetDevSN(){
  try {
    let resp = await mt_MMS.sendCommand('AA00810401B5D1018418D10181072B06010401F6098501028704020101018902C100');
    return mt_Utils.filterString(resp.TLVData.substring(68, 75));
  } catch (error) {
    return null;
  }
}

// function ClearAutoCheck() {
//   var chk = document.getElementById("chk-AutoStart");
//   chk.checked = false;
// }
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
const fromDeviceLogger = (e) => {
  
};
const inputReportLogger = (e) => {
  mt_UI.LogData(`Input Report: ${e.Data}`);
};
const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const MMSMessageLogger = (e) => {
  if(client)
  {
    let options = {
      retain: false
    }
    client.publish(`MagTek/Server/${devPath}/MMSMessage`, e.Data, options);
  }
};

function OpenMQTT(){
  let options = {
    clean: true,
    connectTimeout: 4000,
    clientId: `MagTekClient-${mt_Utils.makeid(6)}`,
    username: userName,
    password: password,
    reconnectPeriod: 1000,
    keepalive: 60,
    will: {
      topic:`MagTek/Server/${devPath}/Status`,
      retain: true,
      payload:"disconnected"
    }
  };
  
  client = mqtt.connect(url, options);
  client.on('connect', onMQTTConnect);
  client.on('message', onMQTTMessage);
}

function CloseMQTT(){
  if(client)
  {
    let options = 
    {
      retain: true
    }
    
    client.publish(`MagTek/Server/${devPath}/Status`, 'disconnected', options);
    client.end();
    client = null;      
  }
  EmitObject({Name:"OnDeviceClose", Device:client});
}

function onMQTTConnect() {  
  // Subscribe to a topic
  let options = {
    retain: true
  }
  client.unsubscribe(`MagTek/Device/${devPath}/#`, CheckMQTTError)
  client.publish(`MagTek/Server/${devPath}/Status`, 'connected', options);
  client.subscribe(`MagTek/Device/${devPath}/#`, CheckMQTTError)
  mt_UI.LogData(`Connected to: MagTek/Device/${devPath}`);
};

function CheckMQTTError (err) {
  if (err) 
  {
    EmitObject({Name:"OnError",
      Source: "MQTTError",
      Data: err
    });
  }
};

function onMQTTMessage(topic, message) {
    let data = message.toString();
    mt_MMS.sendCommand(data);
};


// Subscribe to  events
EventEmitter.on("OnInputReport", inputReportLogger);
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);
EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);
EventEmitter.on("OnDeviceResponse", fromDeviceLogger);
EventEmitter.on("OnError", errorLogger);
EventEmitter.on("OnMMSMessage", MMSMessageLogger);