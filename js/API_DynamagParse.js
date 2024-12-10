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


let data_Buffer_Report = "";
let data_Buffer_Response = "";


var appOptions = {
  responseDelay: 5,
};

let technology = "";



function EmitObject(e_obj) {  
  EventEmitter.emit(e_obj.Name, e_obj);
}



export function parseV5Packet(data) {
  //ParseInputReportBytes(data); 
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
      var outString = parseExtendedReport(hex);
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
  //ParseInputReportBytes(data); 
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
      var outString = parseExtendedReport(hex);
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
  var report_id = report.substring(0, 2);
  var report_rc = report.substring(2, 4);
  var part_data_len = parseInt(report.substring(4, 6), 16);
  var offset = parseInt(report.substring(6, 10), 16);
  var notification_id = report.substring(10, 14);
  var msg_data_len = parseInt(report.substring(14, 18), 16);
  var msg_data = report.substring(18, part_data_len * 2 + 18);
  var outString = "";
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
  var respnseCode = response.substring(0, 2);
  var part_data_len = parseInt(response.substring(2, 4), 16);
  var offset = parseInt(response.substring(4, 8), 16);
  var response_rc = response.substring(8, 12);
  var msg_data_len = parseInt(response.substring(12, 16), 16);
  var msg_data = response.substring(16, part_data_len * 2 + 16);
  mt_Utils.debugLog("Extend Response: " + response);
  mt_Utils.debugLog("respnseCode: " + respnseCode);
  mt_Utils.debugLog("part_data_len: " + part_data_len);
  mt_Utils.debugLog("offset: " + offset);
  mt_Utils.debugLog("response_rc: " + response_rc);
  mt_Utils.debugLog("msg_data_len: " + msg_data_len);
  mt_Utils.debugLog("msg_data: " + msg_data);
  var outString = "";
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
  for (var i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};

function buildCmdArray(commandstring, reportLen) {
  var cmdArray = mt_Utils.hexToBytes(commandstring).zeroFill(reportLen);
  return new Uint8Array(cmdArray);
}

export function calcDateTime() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const year = now.getFullYear() - 2008;
  const dateTimeString =
    mt_Utils.makeHex(month, 2) +
    mt_Utils.makeHex(day, 2) +
    mt_Utils.makeHex(hour, 2) +
    mt_Utils.makeHex(minute, 2) +
    mt_Utils.makeHex(second, 2) +
    "00" +
    mt_Utils.makeHex(year, 2);
    const command =
    "491E0000030C00180000000000000000000000000000000000" + dateTimeString;
  return command;
}

function getExtendedCommandArray(commandStr, dataStr) {
  var command = mt_Utils.hexToBytes(commandStr);
  var data = mt_Utils.hexToBytes(dataStr);
  var result = [];
  const MAX_DATA_LEN = 60;
  var commandLen = 0;
  var dataLen = 0;
  if (command != null) {
    commandLen = command.length;
  }
  if (commandLen != 2) {
    return null;
  }
  if (data != null) {
    dataLen = data.length;
  }
  var offset = 0;
  while (offset < dataLen || dataLen == 0) {
    var len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    var extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    var i;
    for (i = 0; i < len; i++) {
      extendedCommand[8 + i] = data[offset + i];
    }
    offset += len;
    result.push(mt_Utils.toHexString(extendedCommand));

    if (dataLen == 0) break;
  }
  return result;
}

function getExtCommandArray(commandStr) {
  var command = mt_Utils.hexToBytes(commandStr);
  var result = [];
  const MAX_DATA_LEN = 60;
  var commandLen = 0;
  var dataLen = parseInt(commandStr.substring(4, 8), 16);
  var offset = 0;
  while (offset < dataLen || dataLen == 0) {
    var len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    var extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    var i;
    for (i = 0; i < len; i++) {
      extendedCommand[8 + i] = command[4 + offset + i];
    }
    offset += len;
    result.push(mt_Utils.toHexString(extendedCommand));

    if (dataLen == 0) break;
  }
  return result;
}

export async function sendExtendedCommand(cmdNumber, cmdData) {
  try {
    var msgComplete = true;
    var extendedResponse = "";
    var cmds = getExtendedCommandArray(cmdNumber, cmdData);
    for (var index = 0; index < cmds.length; index++) {
      var deviceResponse = await sendDeviceCommand(cmds[index]);
      var rc = deviceResponse.substring(2, 4);
      switch (rc) {
        case "0A": //more data is available
          extendedResponse = parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B": //buffering data
          msgComplete = true;
          extendedResponse = deviceResponse;
          break;
        default:
          msgComplete = true;
          extendedResponse = deviceResponse;
      }
    }

    while (!msgComplete) {
      //we need to get more data...
      deviceResponse = await sendDeviceCommand("4A00");
      rc = deviceResponse.substring(2, 4);
      switch (rc) {
        case "0A":
          extendedResponse = parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B":
          extendedResponse = deviceResponse;
          break;
        default:          
          extendedResponse = deviceResponse;
      }
    }
    return  extendedResponse;
  } catch (error) {
    return error;
  }
}

export async function sendExtCommand(cmdData) {
  try {
    var index;
    var msgComplete = true;
    var extendedResponse = "";
    var cmds = getExtCommandArray(cmdData);
    for (index = 0; index < cmds.length; index++) {
      
      var deviceResponse = await sendDeviceCommand(cmds[index]);      
      var rc = deviceResponse.substring(0, 2);
      switch (rc) {
        case "0A": //more data is available
          extendedResponse = parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B": //buffering data
          msgComplete = true;
          extendedResponse = deviceResponse;
          break;
        default:
          msgComplete = true;
          extendedResponse = deviceResponse;
      }
    }

    while (!msgComplete) {
      //we need to get more data...
      deviceResponse = await sendDeviceCommand("4A00");
      rc = deviceResponse.substring(0, 2);
      switch (rc) {
        case "0A":
          extendedResponse = parseExtendedResponse(deviceResponse);
          if (extendedResponse.length > 0) {
            msgComplete = true;
          } else {
            msgComplete = false;
          }
          break;
        case "0B":
          extendedResponse = deviceResponse;
          break;
        default:
          extendedResponse = deviceResponse;
      }
    }
    return extendedResponse;
  } catch (error) {
    throw error;
  }
}

export async function getBLEFWID() {
  let ret = await sendCommand("460401000000");
  if(ret.substring(0,2) != "00") return "";
  let data = ret.substring(10);
  let dl = mt_Utils.makeHex(data.length);
  return `00${dl}${data}`;

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
  } catch (error) {
    return error;
  }
}

function parseV5ReturnInfo(packet) {
 try {
  let returnString;
  let packetString = packet.replace(/\s+/g, ""); 
  length = parseInt(packetString.substring(4, 6), 16);
  returnString = packetString.substring(2,(length * 2) + 6);
  return returnString;
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
    var ParsedMSR = ParseMSR(mt_Utils.hexToBytes(msg));
    EmitObject({ Name: "OnV5MSRSwipe", Data: ParsedMSR });
}


function ParseMSR(cardDataBytes) {

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
  }

  let _track1 = {
    DecodeStatus:  parseInt(mt_Utils.toHexString(cardDataBytes.slice(0, 1)),16),
    EncryptedData: mt_Utils.toHexString(cardDataBytes.slice(7, 119)).substring(0,Track_1_Encrypted_Data_Length*2),
    MaskedData: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(508, 620))),

  }
  
  let _track2 = {
    DecodeStatus: parseInt(mt_Utils.toHexString(cardDataBytes.slice(1, 2)),16),
    EncryptedData: mt_Utils.toHexString(cardDataBytes.slice(119, 231)).substring(0,Track_2_Encrypted_Data_Length*2),
    MaskedData: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(620, 732))),
  }
  
  let _track3 = {
    DecodeStatus: parseInt(mt_Utils.toHexString(cardDataBytes.slice(2, 3)),16),
    EncryptedData: mt_Utils.toHexString(cardDataBytes.slice(231, 343)).substring(0,Track_3_Encrypted_Data_Length*2),
    MaskedData: mt_Utils.hexToASCIIRemoveNull(mt_Utils.toHexString(cardDataBytes.slice(732, 844))),
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
