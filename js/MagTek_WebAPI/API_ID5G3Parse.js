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

  if (data_Buffer_Response.length >= _msgLen * 2)
  {
    EmitObject({Name: "OnID5Message",Data: data_Buffer_Response}); 
    let ParsedMSR = ParseID5G3MSR(data_Buffer_Response);
    data_Buffer_Response = "";
  } 

}

export function ParseID5G3MSR(buffer) {
  let _resp = ParseID5MSRMode(buffer);
  return _resp;
}


function ParseID5MSRMode(buffer)
{

  let _resp = null;
  let cardArray = mt_Utils.hexToASCIIRemoveNull(buffer).split("|");
  
  switch (cardArray[0]) {
    case "M001":
      _resp = ParseNormalMode(buffer);
      break;
    case "Q001":
      _resp = ParseQwantumSwipe(buffer);
      break;
    case "Q002":
      _resp = ParseQwantumPush(buffer);
      break;
    default:
      EmitObject({ Name: "OnError", Source:"ID5G3", Data: "Unknown MSR Mode" });      
      break;
  }
  return _resp;
}

function ParseNormalMode(buffer)
{
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
    Mode: cardArray[0],
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
  EmitObject({ Name: "OnID5MSRSwipe", Data: _resp});
  return _resp;

}

function ParseQwantumSwipe(buffer)
{
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
    Mode: cardArray[0],
    TokenStatus: cardArray[3],
    TokenData: cardArray[4],
    QwantumData: cardArray[6],
    Data: mt_Utils.hexToASCIIRemoveNull(buffer),
  }

  let _device  = {
    SerialNumber: cardArray[7],
    KeySerialNumber: cardArray[1],
    KeyInfo: cardArray[2],
    SessionID: cardArray[5],
    MACKeyInfo: cardArray[8],    
    MACData: cardArray[10],
    Transport: "Swipe"
  }

  let _resp = {
    Card: _card,
    Device: _device,
  };
  EmitObject({ Name: "OnQwantumSwipe", Data: _resp});
  return _resp;
  

}
function ParseQwantumPush(buffer)
{
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
    Mode: cardArray[0],
    TokenStatus: "NA",
    TokenData: "NA",
    QwantumData: cardArray[4],
    Data: mt_Utils.hexToASCIIRemoveNull(buffer),
  }

  let _device  = {
    SerialNumber: cardArray[5],
    KeySerialNumber: cardArray[1],
    KeyInfo: cardArray[2],
    SessionID: cardArray[3],
    MACKeyInfo: cardArray[6],    
    MACData: cardArray[8],
    Transport: "ButtonPush"
  }

  let _resp = {
    Card: _card,
    Device: _device,
  };
  
  EmitObject({ Name: "OnQwantumPush", Data: _resp});
  return _resp;

}



export function parseExtendedReport(report) {
  let report_id = report.substring(0, 2);
  //let report_rc = report.substring(2, 4);
  let part_data_len = parseInt(report.substring(4, 6), 16);
  let offset = parseInt(report.substring(6, 10), 16);
  let notification_id = report.substring(10, 14);
  let msg_data_len = parseInt(report.substring(14, 18), 16);
  let msg_data = report.substring(18, part_data_len * 2 + 18);
  let outString = "";
  if (part_data_len == msg_data_len) {
    //we don't need to buffer this data it's full length
    outString =
      report_id +
      notification_id +
      mt_Utils.makeHex(msg_data_len, 4) +
      msg_data;
  } else {
    //we need to buffer this data it's partial length
    if (offset == 0) data_Buffer_Report = ""; //This is the first packet clear the buffer
    data_Buffer_Report += msg_data;
    if (data_Buffer_Report.length == msg_data_len * 2) {
      //We now have a complete report - let's send it
      outString =
        report_id +
        notification_id +
        mt_Utils.makeHex(msg_data_len, 4) +
        data_Buffer_Report;
      data_Buffer_Report = "";
    }
  }
  return outString;
}

export function parseExtendedResponse(response) {
  let respnseCode = response.substring(0, 2);
  let part_data_len = parseInt(response.substring(2, 4), 16);
  let offset = parseInt(response.substring(4, 8), 16);
  let response_rc = response.substring(8, 12);
  let msg_data_len = parseInt(response.substring(12, 16), 16);
  let msg_data = response.substring(16, part_data_len * 2 + 16);
  let outString = "";
  if (part_data_len == msg_data_len + 6) {
    //we don't need to buffer this data it's full length
    outString =  response.substring(8);
  } else {
    //we need to buffer this data it's partial length
    if (offset == 0) 
    {
      data_Buffer_Response = response.substring(8);
    } else 
    {
      data_Buffer_Response += msg_data;
    }
      let totalLen = msg_data_len * 2 + 8;
      if (data_Buffer_Response.length >= totalLen ) 
      {
      outString = data_Buffer_Response;
      data_Buffer_Response = "";
      }
  }
  return outString;
};

export function parseID5Response(hexdata){
  let Msg = mt_Utils.hexToBytes(hexdata);
  let MsgData = mt_Utils.toHexString(Msg.slice(4, Msg.length));
  const ID5Message = {
      ReturnCode: mt_Utils.makeHex((Msg[0] << 8) | Msg[1], 4),
      DataLen: parseInt(mt_Utils.makeHex((Msg[2] << 8) | Msg[3], 4),16),
      Data: MsgData,
      AsciiData: mt_Utils.hexToASCII(MsgData),
      HexString: hexdata
  }
  return ID5Message;
};


