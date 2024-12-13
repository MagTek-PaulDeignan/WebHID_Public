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

let data_Buffer_Report = "";
let data_Buffer_Response = "";

function EmitObject(e_obj) {  
  EventEmitter.emit(e_obj.Name, e_obj);
}

export function parseV5Packet(data) {
  let hex = mt_Utils.toHexString(data);
  let report_id = hex.substring(0, 2);
  switch (report_id) {
    //this case is added to support Dynamag MSR
    case "00":
      processMsgType(hex);
      break;
    case "01":
      processMsgType(hex);
      break;
    case "02":
      let outString = parseExtendedReport(hex);
      if (outString.length > 0) {
        processMsgType(outString);
      }
      break;  
    default:
      EmitObject({
        Name: "OnError",
        Source: "parseV5Packet Unknown Report ID",
        Data: hex,
      });
  }
}

export function parseID5G3Packet(data) {
  let hex = mt_Utils.toHexString(data);
  let report_id = hex.substring(0, 2);
  switch (report_id) {
    //this case is added to support Dynamag MSR
    case "00":
      processMsgType(hex);
      break;
    case "01":
      processMsgType(hex);
      break;
    case "02":
      let outString = parseExtendedReport(hex);
      if (outString.length > 0) {
        processMsg(outString);
      }
      break;
    default:
      EmitObject({
        Name: "OnError",
        Source: "parseV5Packet Unknown Report ID",
        Data: hex,
      });
  }
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
      //data_Buffer_Response = ""; //This is the first packet clear the buffer
      data_Buffer_Response = respnseCode + response.substring(8);
    } else 
    {
      data_Buffer_Response += msg_data;
    }
      if (data_Buffer_Response.length == msg_data_len * 2 + 6) {
      //We now have a complete report - let's send it
      outString = data_Buffer_Response;
      data_Buffer_Response = "";
    }
  }
  return outString;
};


Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};

export function processMsgType(msg) {

  let msgType = "";
  switch (msg.substring(0, 2)) {
    case "00": //Dynamag Card Swipe 
      msgType = "Card Swipe";
      processMSRDataMsg(msgType, msg.substring(2));
      break;
    default: //Unknown
      msgType = "Unknown Message Type";
      EmitObject({ Name: "OnError", Source:"Dynamag", Data: msgType });      
  }
}


function processMSRDataMsg(messageType, msg) {
    let ParsedMSR = ParseMSR(mt_Utils.hexToBytes(msg));
    EmitObject({ Name: "OnV5MSRSwipe", Data: ParsedMSR });
}


function ParseMSR(cardDataBytes) {
let _resp = null;

switch (cardDataBytes.length) 
{
  case 337:
    _resp = ParseMT211MSR(cardDataBytes);
    break;
  case 856:
    _resp = ParseMagneSafeV5MSR(cardDataBytes);
    break;
  case 887:
    _resp = ParseMagneSafeV5MSR(cardDataBytes);
    break;
  default:
    EmitObject({ Name: "OnError", Source: "ParseMSR", Data: "Unknown MSR Type" });
    break;
}
  return _resp;
}

function ParseMagneSafeV5MSR(cardDataBytes) {

  let Track_1_Encrypted_Data_Length = parseInt(mt_Utils.toHexString(cardDataBytes.slice(3, 4)),16);
  let Track_2_Encrypted_Data_Length = parseInt(mt_Utils.toHexString(cardDataBytes.slice(4, 5)),16);
  let Track_3_Encrypted_Data_Length = parseInt(mt_Utils.toHexString(cardDataBytes.slice(5, 6)),16);
  let MagnePrint_Data_Length = parseInt(mt_Utils.toHexString(cardDataBytes.slice(348, 349)),16);
  
  let _card  = {
    EncodeType: mt_Utils.toHexString(cardDataBytes.slice(6, 7)),
    MagnePrintStatus: mt_Utils.toHexString(cardDataBytes.slice(343, 348)),
    MagnePrintData: mt_Utils.toHexString(cardDataBytes.slice(349, 477)).substring(0,MagnePrint_Data_Length*2),
  }

  let _device  = {
    SerialNumber: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(477, 493))),
    EncryptionStatus: mt_Utils.toHexString(cardDataBytes.slice(493, 495)),
    KeySerialNumber: mt_Utils.toHexString(cardDataBytes.slice(495, 505)),
    SessionID: mt_Utils.toHexString(cardDataBytes.slice(844, 852)),
    Transport: "Swipe"
  }

  let _track1 = {
    DecodeStatus:  parseInt(mt_Utils.toHexString(cardDataBytes.slice(0, 1)),16),
    EncryptedData: mt_Utils.toHexString(cardDataBytes.slice(7, 119)).substring(0,Track_1_Encrypted_Data_Length*2),
    Data: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(508, 620))),

  }
  
  let _track2 = {
    DecodeStatus: parseInt(mt_Utils.toHexString(cardDataBytes.slice(1, 2)),16),
    EncryptedData: mt_Utils.toHexString(cardDataBytes.slice(119, 231)).substring(0,Track_2_Encrypted_Data_Length*2),
    Data: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(620, 732))),
  }
  
  let _track3 = {
    DecodeStatus: parseInt(mt_Utils.toHexString(cardDataBytes.slice(2, 3)),16),
    EncryptedData: mt_Utils.toHexString(cardDataBytes.slice(231, 343)).substring(0,Track_3_Encrypted_Data_Length*2),
    Data: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(732, 844))),
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
function ParseMT211MSR(cardDataBytes) {

  let _card  = {
    EncodeType: mt_Utils.toHexString(cardDataBytes.slice(6, 7)),
    MagnePrintStatus: "NA",
    MagnePrintData: "",
  }

  let _device  = {
    SerialNumber: "NA",
    EncryptionStatus: "Clear Text",
    KeySerialNumber: "NA",
    SessionID: "NA",
    Transport: "Swipe"
  }

  let _track1 = {
    DecodeStatus:  parseInt(mt_Utils.toHexString(cardDataBytes.slice(0, 1)),16),
    EncryptedData: "",
    Data: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(7, 116))),

  }
  
  let _track2 = {
    DecodeStatus: parseInt(mt_Utils.toHexString(cardDataBytes.slice(1, 2)),16),
    EncryptedData: "",
    Data: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(117, 226))),
  }
  
  let _track3 = {
    DecodeStatus: parseInt(mt_Utils.toHexString(cardDataBytes.slice(2, 3)),16),
    EncryptedData: "",
    Data: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(227, 336))),
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