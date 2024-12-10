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


let data_Buffer_Response = "";


var appOptions = {
  responseDelay: 5,
};



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
        Source: "parseV5Packet Unknown Report ID",
        Data: hex,
      });
  }
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
      var cmdInput = buildCmdArray(cmdToSend, reportLen);
      mt_Utils.debugLog(`sendCommand: ${mt_Utils.toHexString(cmdInput)}`);
      var numBytes = await window.mt_device_hid.sendFeatureReport(1, cmdInput);
      let dv = await getDeviceResponse();
      mt_Utils.debugLog(`v5 parse sendResponse: ${dv}`);
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
        var DataView = await window.mt_device_hid.receiveFeatureReport(1);
        var FP = new Uint8Array(DataView.buffer);
        var RT = FP.slice(1, FP[2] + 3);
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

export function processMsgType(msg) {

  var msgType = "";
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
    let arry = mt_Utils.hexToASCIIRemoveNull(data_Buffer_Response).split("|");
    let ParsedMSR = ParseID5G3MSR(arry);
    EmitObject({ Name: "OnV5MSRSwipe", Data: ParsedMSR});
    data_Buffer_Response = "";
  } 

}

function ParseID5G3MSR(cardArray) {

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
  }

  let _track1 = {
    DecodeStatus:  0,
    EncryptedData: cardArray[4],
    MaskedData: cardArray[1],
  }
  
  let _track2 = {
    DecodeStatus: 0,
    EncryptedData: cardArray[5],
    MaskedData: cardArray[2],
  }
  
  let _track3 = {
    DecodeStatus: 0,
    EncryptedData: cardArray[6] ,
    MaskedData: cardArray[3],
  }

  let _resp = {
    Track1: _track1,
    Track2: _track2,
    Track3: _track3,
    Card: _card,
    Device: _device,
  };
  
  return _resp;
}
