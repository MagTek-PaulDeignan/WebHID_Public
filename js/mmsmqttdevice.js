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
import * as mt_Device from "./MagTek_WebAPI/API_mmsHID.js";
import * as mt_UI from "./mt_ui.js";
import * as mt_AppSettings from "./MagTek_WebAPI/config/appsettings.js";
import mqtt  from "./MagTek_WebAPI/mqtt.esm.js";
import "./MagTek_WebAPI/mt_events.js";

let url = mt_Utils.getEncodedValue('MQTTURL','d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==');
let devPath = mt_Utils.getEncodedValue('MQTTDevice','');
let friendlyName = mt_Utils.getEncodedValue('MQTTDeviceFriendlyName','');
let userName = mt_Utils.getEncodedValue('MQTTUser','RGVtb0NsaWVudA==');
let password = mt_Utils.getEncodedValue('MQTTPassword','ZDNtMENMdjFjMQ==');

let client = null;
export let _openTimeDelay = 1500;

document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);
document
  .querySelector("#deviceNameSave")
  .addEventListener("click", handleDeviceNameSave);
document
  .addEventListener("DOMContentLoaded", handleDOMLoaded);

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

async function handleDOMLoaded() {
  
  document.getElementById("txFriendlyName").value = friendlyName;

  let devices = await mt_Device.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });


  //Add the hid event listener for connect/plug in
  navigator.hid.addEventListener("connect", async ({ device }) => {
    EmitObject({Name:"OnDeviceConnect", Device:device});
    if (window.mt_device_WasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
  });

  //Add the hid event listener for disconnect/unplug
  navigator.hid.addEventListener("disconnect", ({ device }) => {
    let options = {
      retain: true
    }
    
    client.publish(`${mt_AppSettings.MQTT.MMS_Base_Pub}${devPath}/Status`, 'disconnected', options);
    EmitObject({Name:"OnDeviceDisconnect", Device:device});
  });

  await mt_Utils.wait(_openTimeDelay);
  await handleOpenButton();

}

async function handleCloseButton() {
  mt_Device.closeDevice();
  mt_UI.ClearLog();
  CloseMQTT();
}

async function handleOpenButton() {
  mt_UI.ClearLog();
  CloseMQTT();
  mt_Device.closeDevice();
  window.mt_device_hid = await mt_Device.openDevice();
  
  let devSN = await GetDevSN();

  if (friendlyName.length > 0 )
  {
    devPath = `${mt_Utils.filterString(window.mt_device_hid.productName)}/${mt_Utils.filterString(friendlyName)}-${mt_Utils.filterString(devSN)}`;
  }
  else
  {
    devPath = `${mt_Utils.filterString(window.mt_device_hid.productName)}/${mt_Utils.filterString(devSN)}`;
  }
  
  OpenMQTT();
}

async function GetDevSN(){
  try {
    let resp = await mt_Device.sendCommand('AA00810401B5D1018418D10181072B06010401F6098501028704020101018902C100');
    return mt_Utils.filterString(resp.TLVData.substring(68, 75));
  } catch (error) {
    return null;
  }
}


async function handleDeviceNameSave(){
  friendlyName = document.getElementById('txFriendlyName').value;
  mt_Utils.saveEncodedValue('MQTTDeviceFriendlyName',friendlyName);
  mt_UI.LogData (`Device name has been saved: ${friendlyName}`);
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
const fromDeviceLogger = (e) => {
  
};
// const inputReportLogger = (e) => {
//   mt_UI.LogData(`Input Report: ${e.Data}`);
// };
const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const MMSMessageLogger = (e) => {
  if(client)
  {
    let options = {
      retain: false
    }
    client.publish(`${mt_AppSettings.MQTT.MMS_Base_Pub}${devPath}/MMSMessage`, e.Data, options);
  }
};

function OpenMQTT(){
  let options = {
    clean: true,
    connectTimeout: 4000,
    clientId: `MagTekMMSDevice-${mt_Utils.makeid(6)}`,
    username: userName,
    password: password,
    reconnectPeriod: 1000,
    keepalive: 60,
    will: {
      topic:`${mt_AppSettings.MQTT.MMS_Base_Pub}${devPath}/Status`,
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
    
    client.publish(`${mt_AppSettings.MQTT.MMS_Base_Pub}${devPath}/Status`, 'disconnected', options);
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
  client.unsubscribe(`${mt_AppSettings.MQTT.MMS_Base_Sub}${devPath}/MMSMessage`, CheckMQTTError)
  client.publish(`${mt_AppSettings.MQTT.MMS_Base_Pub}${devPath}/Status`, 'connected', options);
  client.subscribe(`${mt_AppSettings.MQTT.MMS_Base_Sub}${devPath}/MMSMessage`, CheckMQTTError)
  mt_UI.LogData(`Connected to: ${mt_AppSettings.MQTT.MMS_Base_Sub}${devPath}`);
  let path = `${mt_AppSettings.MQTT.MMS_PageURL}${devPath}`
  mt_UI.UpdateQRCodewithLink(path);

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
    mt_Device.sendCommand(data);
};


// Subscribe to  events
//EventEmitter.on("OnInputReport", inputReportLogger);
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);
EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);
EventEmitter.on("OnDeviceResponse", fromDeviceLogger);
EventEmitter.on("OnError", errorLogger);
EventEmitter.on("OnMMSMessage", MMSMessageLogger);
