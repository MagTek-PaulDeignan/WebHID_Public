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
import * as mt_Configs from "./config/DeviceConfig.js";
import * as mt_AppSettings from "./config/appsettings.js";


let data_Buffer_Response = "";


function EmitObject(e_obj) {  
  EventEmitter.emit(e_obj.Name, e_obj);
}



export function parseID5G3Packet(data) {
  let hex = mt_Utils.toHexString(data);
  let report_id = hex.substring(0, 2);
  switch (report_id) {
    case "01":
      processMsgType(hex);
      break;
    default:
      EmitObject({
        Name: "OnError",
        Source: "parseID5G3Packet Unknown Report ID",
        Data: hex,
      });
  }
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
      let _devinfo = mt_Configs.getHIDDeviceInfo(window.mt_device_hid.productId);
      let reportLen = _devinfo.ReportLen;
      let cmdInput = buildCmdArray(cmdToSend, reportLen);
      let numBytes = await window.mt_device_hid.sendFeatureReport(1, cmdInput);
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
        let DataView = await window.mt_device_hid.receiveFeatureReport(1);
        let FP = new Uint8Array(DataView.buffer);
        let RT = FP.slice(1, FP[2] + 3);
        resolve(mt_Utils.toHexString(RT));
      } catch (err) {
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

export function processMsgType(msg) {

  
  let msgType = "";
  switch (msg.substring(0, 2)) {
     case "01": 
       msgType = "ID5G3 Card Swipe";
       processID5G3Msg(msg.substring(2));
       break;
    default: 
      msgType = "Unknown Message Type";
      EmitObject({ Name: "OnError", Source:"ID5G3", Data: msgType });      
  }
}

function processID5G3Msg(msg) {

let _packetLen = parseInt(msg.substring(0,2),16);
let _offset = parseInt(msg.substring(2,6),16);
let _msgLen = parseInt(msg.substring(10,14),16);
let _msg =  msg.substring(14, (_packetLen*2)+2);

 if (_offset == 0)
  {
     data_Buffer_Response = ""; //This is the first packet clear the buffer
     data_Buffer_Response = _msg;
  } 
   else 
  {
     data_Buffer_Response += _msg;
  }

  if (data_Buffer_Response.length > _msgLen * 2){
    data_Buffer_Response = "";
  }

  if (_msgLen * 2 == data_Buffer_Response.length)
  {
    EmitObject({Name: "OnV5Message",Data: data_Buffer_Response}); 
    let ParsedMSR = ParseID5G3MSR(data_Buffer_Response);
    data_Buffer_Response = "";
  } 

}

export function ParseID5G3MSR(buffer) {
  let newBuff = "";
  let endsWith = buffer.substring(buffer.length -2, buffer.length)
  if (endsWith == "0D")
  {
    newBuff = buffer.substring(0, buffer.length -2)
  }
  else
  {
    newBuff = buffer;
  }
  
  let cardArray = mt_Utils.hexToASCIIRemoveNull(newBuff).split("|");

  let _card  = {
    EncodeType: "00",
    MagnePrintStatus: cardArray[7],
    MagnePrintData: cardArray[8] ,
  }

  let _device  = {
    SerialNumber: cardArray[14],
    EncryptionStatus: cardArray[11],
    KeySerialNumber: cardArray[10],
    SessionID: cardArray[17],
    Transport: "Swipe"
  }

  let _track1 = {
    DecodeStatus:  0,
    EncryptedData: cardArray[4],
    Data: cardArray[1],
  }
  
  let _track2 = {
    DecodeStatus: 0,
    EncryptedData: cardArray[5],
    Data: cardArray[2],
  }
  
  let _track3 = {
    DecodeStatus: 0,
    EncryptedData: cardArray[6] ,
    Data: cardArray[3],
  }

  let _resp = {
    Track1: _track1,
    Track2: _track2,
    Track3: _track3,
    Card: _card,
    Device: _device,
  };
  
  EmitObject({ Name: "OnV5MSRSwipe", Data: _resp});
  return _resp;
}
