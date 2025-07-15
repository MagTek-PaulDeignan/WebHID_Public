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

import * as mt_MMS from "./API_mmsParse.js";
import * as mt_AppSettings from "./config/appsettings.js";
import mqtt from "./mqtt.esm.js";
import "./mt_events.js";
import * as mt_Utils from "./mt_utils.js";

let _url = "";
let _devPath = "";
let _userName = "";
let _password = "";
let _client = null;


export let _activeCommandMode = true;


export function setActiveCommandMode(mode){
  _activeCommandMode =  (mode === "true");
}



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
  if(UserName != null){
    if (UserName.length == 0 ) _userName = null;
  }
  
};

/**
 * @param {string} Password
 */
export function setPassword(Password) {
  _password = Password;
  if(Password != null){
    if (Password.length == 0 ) _password = null;
  }
  
};

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

export async function sendBase64Command(cmdToSendB64) {
  return await SendCommand(mt_Utils.base64ToHex(cmdToSendB64));
}


export async function SendCommand(cmdHexString) {

  if (!_activeCommandMode) {
    EmitObject({
      Name: "OnError",
      Source: "SendCommand",
      Data: "Session not active",
    });
    return;
  }
  window.mt_device_response = null;     
    _client.publish(`${mt_AppSettings.MQTT.MMS_Base_Sub}${_devPath}/MMSMessage`, cmdHexString);
    let Resp = await waitForDeviceResponse();
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

export async function GetDeviceSN(){
  let resp = await SendCommand("AA0081040100D101841AD10181072B06010401F609850102890AE208E106E104E102C100");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false) ;
  let data = mt_Utils.getTagValue("C1","",tag89, false);
  return data.substring(0,7);
}

export async function GetDeviceFWID(){
  let resp = await SendCommand("AA0081040102D101841AD10181072B06010401F609850102890AE108E206E204E202C200");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false);
  let data = mt_Utils.getTagValue("C2","",tag89, true);
  return data;
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
    _client.on('connect', ()=>{});
    _client.on('message', ()=>{});
    await _client.end();
    _client = null;      
  }
  EmitObject({Name:"OnDeviceClose", Device:_client});
}

async function onMQTTConnect(_connack) {    
  if(_client != null){
  // Subscribe to a topic
  if(_devPath.length > 0)
  {
    await _client.unsubscribe(`${mt_AppSettings.MQTT.MMS_Base_Pub}${_devPath}/MMSMessage`, CheckMQTTError);  
    await _client.subscribe(`${mt_AppSettings.MQTT.MMS_Base_Pub}${_devPath}/MMSMessage`, CheckMQTTError);    

  }
  await _client.unsubscribe(`${mt_AppSettings.MQTT.MMS_DeviceList}`, CheckMQTTError);
  await _client.subscribe(`${mt_AppSettings.MQTT.MMS_DeviceList}`, CheckMQTTError);  

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

  //console.log(`onMQTTMessage:  ${topic}: ${message}` );
  let data = "";
        
    let topicArray = topic.split('/');
    if(topicArray.length >= 5){
      switch (topicArray[topicArray.length-1]) {
        case "Status":
          data = message.toString();    
          //console.log(`status --- ${topic} ${message}`);
          EmitObject({Name:"OnMQTTStatus", Data: { Topic:topic, Message:data} }); 
          if( `${topicArray[topicArray.length-3]}/${topicArray[topicArray.length-2]}` == _devPath){
          if( data.toLowerCase() == "connected")
          {
            if(_client)
              {              
              EmitObject({Name:"OnDeviceOpen", Device:_client});
              ///console.log(`open --- ${topic} ${message}`); 
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
          if (message)
            {
              if (message[0] == 170)  // this must be in DynaFlex Binary Mode ("170 = 0xAA")
              {
                mt_MMS.ParseMMSMessage(message);
              }
              else
              {
                mt_MMS.ParseMMSMessage(mt_Utils.hexToBytes(message.toString()));
              }
            }
          break;
        default:
          console.log(`${topic}: ${data}`);
          break;
      }
    }
};



//Temporary - in Dev  

export async function PrintData(Path, JSONData) {
    _client.publish(`${Path}/Print`, JSONData);
    return true;
};