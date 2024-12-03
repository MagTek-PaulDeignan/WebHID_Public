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
import * as mt_AppSettings from "./appsettings.js";
import mqtt  from "./mqtt.esm.js";
import "./mt_events.js";

let _url = "";
let _devPath = "";
let _userName = "";
let _password = "";
let _client = null;


/**
 * @param {string} URL
 */
export function setURL(URL) {
  _url = URL;
};

/**
 * @param {string} Path
 */
export function setPath(Path) {
  _devPath = Path;
};

/**
 * @param {string} UserName
 */
export function setUserName(UserName) {
  _userName = UserName;
  if (UserName.length == 0 ) _userName = null;
};

/**
 * @param {string} Password
 */
export function setPassword(Password) {
  _password = Password;
  if (Password.length == 0 ) _password = null;
};



function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

export async function SendCommand(cmdHexString) {
    window.mt_device_response = null
    _client.publish(`${mt_AppSettings.MQTT.Base_Sub}${_devPath}`, cmdHexString);
    var Resp = await waitForDeviceResponse();
    return Resp;
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

export function OpenMQTT(){
  
  if(_client == null)
  {
    let options = {
      clean: true,
      connectTimeout: 4000,
      clientId: `MagTekClient-${mt_Utils.makeid(6)}`,
      username: _userName,
      password: _password  
    };
    
    _client = mqtt.connect(_url, options);
    _client.on('connect', ()=>{});
    _client.on('connect', onMQTTConnect);
    
    _client.on('message', ()=>{});
    _client.on('message', onMQTTMessage);
  }
};

export async function CloseMQTT(){
  if(_client)
  {
    await _client.end();
    _client = null;      
  }
  EmitObject({Name:"OnDeviceClose", Device:_client});
}

async function onMQTTConnect(connack) {    
  if(_client != null){
  // Subscribe to a topic
  await _client.unsubscribe(`${mt_AppSettings.MQTT.Base_Pub}${_devPath}/MMSMessage`, CheckMQTTError);
  await _client.unsubscribe(`${mt_AppSettings.MQTT.DeviceList}`, CheckMQTTError);
  
  await _client.subscribe(`${mt_AppSettings.MQTT.Base_Pub}${_devPath}/MMSMessage`, CheckMQTTError);
  await _client.subscribe(`${mt_AppSettings.MQTT.DeviceList}`, CheckMQTTError);
  _client.publish(`${mt_AppSettings.MQTT.Base_Pub}${_devPath}/Status`, 'connected');
}
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
    let topicArray = topic.split('/');
    if(topicArray.length >= 5){
      switch (topicArray[topicArray.length-1]) {
        case "Status":
        EmitObject({Name:"OnMQTTStatus", Data: { Topic:topic, Message:data} }); 
          if( `${topicArray[topicArray.length-3]}/${topicArray[topicArray.length-2]}` == _devPath){
          if( data.toLowerCase() == "connected")
          {
            if(_client)
              {              
              EmitObject({Name:"OnDeviceOpen", Device:_client}); 
              }
            else
              {
              EmitObject({Name:"OnDeviceConnect", Device:null});
              }              
          }
          else
          {
            EmitObject({Name:"OnDeviceDisconnect", Device:null});
          }
          }
          break; 
        case "MMSMessage":
          mt_MMS.ParseMMSMessage(mt_Utils.hexToBytes(data));
          break;
        case "V5Message":
          //mt_V5.parse(mt_Utils.hexToBytes(data));
          break;
        default:
          console.log(`${topic}: ${data}`);
          break;
      }
    }
};
