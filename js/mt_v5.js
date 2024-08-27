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
import * as mt_HID from "./mt_hid.js";
export let wasOpened = false;

let mtDeviceType = "";
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
  ParseInputReportBytes(data); 
  let hex = mt_Utils.toHexString(data);
  let report_id = hex.substring(0, 2);
  switch (report_id) {
    //this case is added to support Dynamag MSR
    case "00":
      processMsgType(hex);
      break;
    case "01":
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

function AppendLogData(data) {
  const log = document.getElementById("LogData");
  log.value += data + "\n";
}

function parseExtendedReport(report) {
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

function parseExtendedResponse(response) {
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
    if (window._device == null) {
      EmitObject({
        Name: "OnError",
        Source: "SendCommand",
        Data: "Device is null",
      });
      return 0;
    }
    if (!window._device.opened) {
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
      let _devinfo = mt_HID.getDeviceInfo(window._device.productId);
      let reportLen = _devinfo.ReportLen;
      var cmdInput = buildCmdArray(cmdToSend, reportLen);
      mt_Utils.debugLog(`sendCommand: ${mt_Utils.toHexString(cmdInput)}`);
      var numBytes = await window._device.sendFeatureReport(1, cmdInput);
      let dv = await getDeviceResponse();
      mt_Utils.debugLog(`sendResponse: ${dv}`);
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
        var DataView = await window._device.receiveFeatureReport(1);
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

function processMsg(msg) {
  processMsgType(msg);
}

function processMsgType(msg) {
  var msgType = "";
  switch (msg.substring(0, 2)) {
    case "00": //Device  Response
      msgType = "Device Response";
      processDeviceResponseMsg(msgType, msg);
      break;
    case "01": //MSR Notification
      msgType = "MSR Notification";
      processMSRDataMsg(msgType, msg);
      break;
    case "02": //Device Notification
      msgType = "Device Notification";
      processNotificationMsg(msgType, msg);
      break;
    case "0A": //Device  Extended Response
      msgType = "Device Extended Response";
      processDeviceExtendedResponseMsg(msgType, msg);
      break;
    case "40": //Append Log
      AppendLogData(msg.substring(2) + "\n");
      break;
    case "41": //Display Message
      TextArea = document.getElementById("Display");
      TextArea.innerHTML = msg.substring(2);
      break;
    case "42": //Get TLV Tag Value
      AppendLogData(msg.substring(2) + "\n");
      break;
    case "43": //Get JSON
      AppendLogData(msg.substring(2) + "\n");
      break;
    case "DB": //Debug
      msgType = "Debug";
      processDebugMsg(msgType, msg);
      break;
    default: //Unknown
      msgType = "Unknown";
      processUnknownMsg(msgType, msg);
  }
}

function processDeviceResponseMsg(messageType, msg) {
  EmitObject({ Name: "OnDeviceResponse", Data: msg });
}

function processDeviceExtendedResponseMsg(messageType, msg) {
  AppendLogData(messageType + " : " + msg.substring(2) + "\n");
}

function processMSRDataMsg(messageType, msg) {
  chk = document.getElementById("chk-AutoStart");
  if (chk.checked) {
    var ParsedMSR = ParseMSR(hexToBytes(msg.substring(2)));
    AppendLogData(
      "Track_1_Masked_Data: " +
        hexToASCII(toHexString(ParsedMSR.Track_1_Masked_Data)).substring(
          0,
          ParsedMSR.Track_1_Masked_Data_Length
        ) +
        "\n"
    );
    AppendLogData(
      "Track_2_Masked_Data: " +
        hexToASCII(toHexString(ParsedMSR.Track_2_Masked_Data)).substring(
          0,
          ParsedMSR.Track_2_Masked_Data_Length
        ) +
        "\n"
    );
    AppendLogData(
      "Track_3_Masked_Data: " +
        hexToASCII(toHexString(ParsedMSR.Track_3_Masked_Data)).substring(
          0,
          ParsedMSR.Track_3_Masked_Data_Length
        ) +
        "\n"
    );
    AppendLogData(
      "Track_1_Encrypted_Data: " +
        toHexString(ParsedMSR.Track_1_Encrypted_Data).substring(
          0,
          ParsedMSR.Track_1_Encrypted_Data_Length * 2
        ) +
        "\n"
    );
    AppendLogData(
      "Track_2_Encrypted_Data: " +
        toHexString(ParsedMSR.Track_2_Encrypted_Data).substring(
          0,
          ParsedMSR.Track_2_Encrypted_Data_Length * 2
        ) +
        "\n"
    );
    AppendLogData(
      "Track_3_Encrypted_Data: " +
        toHexString(ParsedMSR.Track_3_Encrypted_Data).substring(
          0,
          ParsedMSR.Track_3_Encrypted_Data_Length * 2
        ) +
        "\n"
    );
    AppendLogData(
      "KSN: " + toHexString(ParsedMSR.DUKPT_Key_Serial_Number) + "\n"
    );
    AppendLogData(
      "Track_1_Decode_Status: " +
        toHexString(ParsedMSR.Track_1_Decode_Status) +
        "\n"
    );
    AppendLogData(
      "Track_2_Decode_Status: " +
        toHexString(ParsedMSR.Track_2_Decode_Status) +
        "\n"
    );
    AppendLogData(
      "Track_3_Decode_Status: " +
        toHexString(ParsedMSR.Track_3_Decode_Status) +
        "\n"
    );
    AppendLogData(msg.substring(2) + "\n");
  } else {
    AppendLogData("Ignoring Swipe" + "\n");
  }
}

function processNotificationMsg(messageType, msg) {
  processNotificationType(msg);
}

function processDebugMsg(messageType, msg) {
  AppendLogData(messageType + " : " + msg.substring(2) + "\n");
}

function processUnknownMsg(messageType, msg) {
  AppendLogData(messageType + " : " + msg + "\n");
}

function processNotificationType(msg) {
  var notifyType = "";
  switch (msg.substring(2, 6)) {
    case "0300":
      notifyType = "Transaction Status Notification";
      var hexstring = msg.substring(10);
      processTransactionStatus(hexstring);
      break;
    case "0301":
      notifyType = "Display Message Notification";
      var hexstring = msg.substring(10);
      var ASCIIString = mt_Utils.hexToASCII(hexstring);
      EmitObject({ Name: "OnUIDisplayMessage", Data: ASCIIString });
      break;
    case "0302":
      notifyType = "User Selection Notification";
      var hexstring = msg.substring(14);
      var ASCIIString = mt_Utils.hexToASCIInulltoNewLine(hexstring);
      EmitObject({ Name: "OnUserSelection", Source: "V5", Data: ASCIIString });
      break;
    case "0303":
      notifyType = "ARQC Notification";
      var hexstring = msg.substring(10);
      EmitObject({ Name: "OnARQCData", Source: technology, Data: hexstring });
      break;
    case "0304":
      notifyType = "Transaction Result Notification";
      var hexstring = msg.substring(12); //skip over Signature Required byte
      EmitObject({
        Name: "OnSignatureRequired",
        Source: technology,
        Data: msg.substring(10, 12),
      });
      EmitObject({
        Name: "OnBatchData",
        Source: technology,
        Data: hexstring,
        SignatureRequired: msg.substring(10, 12),
      });
      break;
    case "0400":
      notifyType = "UART Notification";
      var hexstring = msg.substring(12);
      //processNotificationType(hexstring);
      EmitObject({ Name: "OnUARTData", Source: "V5", Data: hexstring });

      break;
    case "0500":
      notifyType = "SPI Notification - DAV";
      //var len = parseInt(msg.substring(6, 10), 16);
      var hexstring = msg.substring(12);
      EmitObject({ Name: "OnSPIData", Source: "V5", Data: hexstring });
      break;
    default:
      notifyType = "Unknown Notification";
      EmitObject({
        Name: "OnError",
        Source: "ProcessNoticationType",
        Data: msg,
      });
  }
}

function processTransactionStatus(Status) {
  var outString = "";
  switch (Status.substring(0, 2)) {
    case "00":
      outString = "Idle";
      break;
    case "01":
      outString = "Card Inserted";
      technology = "EMV";
      break;
    case "02":
      outString = "Data Error";
      break;
    case "03":
      //
      //outString = "Transaction Progress Change";
      //outString = "        ";
      outString = "";
      break;
    case "04":
      outString = "Waiting for Cardholder Response";
      break;
    case "05":
      outString = "Timed Out";
      break;
    case "06":
      outString = "End Of Transaction";
      break;
    case "07":
      outString = "Host Cancelled";
      break;
    case "08":
      outString = "Card Removed";
      break;
    case "09":
      outString = "Contactless Detected";
      technology = "NFC";
      break;
    case "0A":
      outString = "MSR Swipe Detected";
      technology = "MSR";
      break;
    default:
      outString = "Unknown Status" + Status.substring(0, 2);
  }
  switch (Status.substring(4, 6)) {
    case "00":
      outString = outString + "; " + "Idle";
      break;
    case "01":
        outString = outString + "; " + "Waiting for cardholder to present payment";
      break;
    case "02":
      outString = outString + " " + "Powering up the card" + " ";
      break;
    case "03":
      outString = outString + " " + "Selecting the application" + " ";
      break;
    case "04":
      outString = outString + " " + "Waiting for user language selection" + " ";
      break;
    case "05":
      outString = outString + " " + "Waiting for user application selection" + " ";
      break;
    case "06":
      outString = outString + " " + "Initiating application" + " ";
      break;
    case "07":
      outString = outString + " " + "Reading application data" + " ";
      break;
    case "08":
      outString = outString + " " + "Offline data authentication" + " ";
      break;
    case "09":
      outString = outString + " " + "Process restrictions" + " ";
      break;
    case "0A":
      outString = outString + " " + "Cardholder verification" + " ";
      break;
    case "0B":
      outString = outString + " " + "Terminal risk management" + " ";
      break;
    case "0C":
      outString = outString + " " + "Terminal action analysis" + " ";
      break;
    case "0D":
      outString =
        outString + " " + "Generating first application cryptogram" + " ";
      break;
    case "0E":
      outString = outString + " " + "Card action analysis" + " ";
      break;
    case "0F":
      outString = outString + " " + "Online processing" + " ";
      break;
    case "10":
      outString =
      outString + " " + "Waiting for online processing response" + " ";
      break;
    case "11":
      outString = outString + "; " + "Transaction Complete 11" + " ";
      outString = "";
      break;
    case "12":
      outString = outString + "; " + "Transaction Error" + " ";
      break;
    case "13":
      //We are using QuickChip Don't send this status
      //outString = outString + " " + "Transaction Approved";
      //outString = "";
      //outString = outString + " " + "QuickChip" + " " ;
      outString = "End of QuickChip Transaction 13" + " ";
      break;
    case "14":
      //We are using QuickChip Don't send this status
      //outString = outString + " " + "Transaction Declined";
      //outString = "";
      //outString = outString + " " + "QuickChip" + " " ;
      outString = "End of QuickChip Transaction 14" + " ";
      break;
    case "15":
      outString = outString + "; " + "Transaction Cancelled by MSR Swipe";
      break;
    case "16":
      outString = outString + "; " + "EMV error - Conditions Not Satisfied";
      break;
    case "17":
      outString = outString + "; " + "EMV error - Card Blocked";
      break;
    case "18":
      outString = outString + "; " + "Application selection failed";
      break;
    case "19":
      outString = outString + "; " + "EMV error - Card Not Accepted";
      break;
    case "1A":
      outString = outString + "; " + "Empty Candidate List";
      break;
    case "1B":
      outString = outString + "; " + "Application Blocked";
      break;
    case "1C":
      outString = outString + "; " + "Start Reading Contactless" + " ";
      break;
    case "28":
      outString =
        outString + "; " + "Contactless Application Selection Failed" + " ";
      break;
    case "29":
      outString = "Contactless Remove Card ";
      break;
    case "2A":
      outString = outString + "; " + "Collision Detected";
      break;
    case "2B":
      outString = outString + "; " + "Refer to Mobile";
      break;
    case "2C":
      outString = "Contactless Transaction Complete";
      break;
    case "2D":
      outString = outString + "; " + "Reserved";
      break;
    case "2E":
      outString = outString + "; " + "Wrong Card Type (MSD or EMV)";
      break;
    case "2F":
      outString =
        outString +
        "; " +
        " No Application Interchange Profile (Tag 82) Received";
      break;
    case "31":
      outString = outString + "; " + "NO MSR Data Found";
      break;
    case "3C":
      outString =
        outString +
        "; " +
        "Magnetic Stripe Card Decoded During Technical Fallback";
      break;
    case "3D":
      outString =
        outString + "; " + "Magnetic Stripe Card Decoded During MSR Fallback";
      break;
    case "3E":
      outString =
        outString +
        "; " +
        "Magnetic Stripe Card Decoded Non Technical Fallback";
      break;
    case "91":
      outString =
        outString +
        "; " +
        "Host Canceled EMV Transaction Before Card Was Presented";
      break;
    default:
      outString = outString + "; " + "Unknown Status" + Status.substring(4, 6);
  }

  if (outString == "Card Inserted; Idle") {
    EmitObject({ Name: "OnContactCardInserted", Data: "Idle" });
  } else if (outString == "Card Removed; Idle") {
    EmitObject({ Name: "OnContactCardRemoved", Data: "Idle" });
  } else if (outString.length > 0) {
    EmitObject({ Name: "OnV5Event", Data: outString });
  }
}

function ParseMSR(cardDataBytes) {
  let _resp = {
    Track_1_Decode_Status: cardDataBytes.slice(0, 1),
    Track_2_Decode_Status: cardDataBytes.slice(1, 2),
    Track_3_Decode_Status: cardDataBytes.slice(2, 3),
    Track_1_Encrypted_Data_Length: cardDataBytes.slice(3, 4),
    Track_2_Encrypted_Data_Length: cardDataBytes.slice(4, 5),
    Track_3_Encrypted_Data_Length: cardDataBytes.slice(5, 6),
    Card_Encode_Type: cardDataBytes.slice(6, 7),
    Track_1_Encrypted_Data: cardDataBytes.slice(7, 119),
    Track_2_Encrypted_Data: cardDataBytes.slice(119, 231),
    Track_3_Encrypted_Data: cardDataBytes.slice(231, 343),
    MagnePrint_Status: cardDataBytes.slice(343, 348),
    MagnePrint_Data_Length: cardDataBytes.slice(348, 349),
    Encrypted_MagnePrint_Data: cardDataBytes.slice(349, 477),
    Device_Serial_Number: cardDataBytes.slice(477, 493),
    Device_Encryption_Status: cardDataBytes.slice(493, 495),
    DUKPT_Key_Serial_Number: cardDataBytes.slice(495, 505),
    Track_1_Masked_Data_Length: cardDataBytes.slice(505, 506),
    Track_2_Masked_Data_Length: cardDataBytes.slice(506, 507),
    Track_3_Masked_Data_Length: cardDataBytes.slice(507, 508),
    Track_1_Masked_Data: cardDataBytes.slice(508, 620),
    Track_2_Masked_Data: cardDataBytes.slice(620, 732),
    Track_3_Masked_Data: cardDataBytes.slice(732, 844),
    Encrypted_Session_ID: cardDataBytes.slice(844, 852),
    Track_1_Absolute_Data_Length: cardDataBytes.slice(852, 853),
    Track_2_Absolute_Data_Length: cardDataBytes.slice(853, 854),
    Track_3_Absolute_Data_Length: cardDataBytes.slice(854, 855),
    MagnePrint_Absolute_Data_Length: cardDataBytes.slice(855, 856),
    Remaining_MSR_Transactions: cardDataBytes.slice(856, 859),
    MagneSafe_Version_Number: cardDataBytes.slice(859, 867),
    HID_Report_Version: cardDataBytes.slice(867, 887),
    //MagnePrint_KSN: cardDataBytes.slice(920, 930),
    //Battery_Level: cardDataBytes.slice(930)
  };
  return _resp;
}



function ParseInputReportBytes(input) {
    var dataLen =parseInt( mt_Utils.toHexString(input.slice(7, 9)),16); 
    let _resp = {
      ReportID: mt_Utils.toHexString(input.slice(0, 1)),
      ReportLen: mt_Utils.toHexString(input.slice(1, 3)),
      offset: mt_Utils.toHexString(input.slice(3, 5)),
      NotifyNumber: mt_Utils.toHexString(input.slice(5, 7)),
      DataLen:mt_Utils.toHexString(input.slice(7, 9)),
      DataVal:mt_Utils.toHexString(input.slice(9, 9 + dataLen))
    };
    mt_Utils.debugLog("++++++++++++++++++++++++++++++++++++++++++++++++++++");
    mt_Utils.debugLog("ReportID: " + _resp.ReportID);
    mt_Utils.debugLog("ReportLen: " + _resp.ReportLen);
    mt_Utils.debugLog("offset: " + _resp.offset);
    mt_Utils.debugLog("NotifyNumber: " + _resp.NotifyNumber);
    mt_Utils.debugLog("DataLen: " + _resp.DataLen);
    mt_Utils.debugLog("DataVal: " + _resp.DataVal);
    mt_Utils.debugLog("++++++++++++++++++++++++++++++++++++++++++++++++++++");
  };
  
  export async function openDevice() {
    try {
      var reqDevice;
      var devices = await navigator.hid.getDevices();
      var device = devices.find((d) => d.vendorId === mt_HID.vendorId);
  
      if (!device) {
        let vendorId = mt_HID.vendorId;
        reqDevice = await navigator.hid.requestDevice({
          filters: mt_HID.filters,
        });
        if(reqDevice != null)
        {
          if (reqDevice.length> 0)
          {
            device = reqDevice[0];
          }
        }
      }
  
      if (!device.opened) {
        device.addEventListener("inputreport", handleInputReport);
        await device.open();
      }
      if (device.opened) {
        wasOpened = true;        
        let _devinfo = mt_HID.getDeviceInfo(device.productId);
        mtDeviceType = _devinfo.DeviceType;
  
        switch (mtDeviceType) {
          case "V5":
            EmitObject({Name:"OnDeviceOpen", 
              Device:device
            });
            break;
          default:
            EmitObject({Name:"OnError",
              Source: "Bad DeviceType",
              Data: `Use the ${mtDeviceType} Parser`
            });
            break;
        }
      }
      return device;
    } catch (error) {
      EmitObject({Name:"OnError",
        Source: "OpenDevice",
        Data: "Error opening device",
      });
    }
  };
  
  export async function closeDevice(){
    wasOpened = false;
  if (window._device != null) {
    await window._device.close();
    EmitObject({Name: "OnDeviceClose", Device: window._device});
  }
  };

  function handleInputReport(e) {
    var packetArray = [];
    var dataArray = new Uint8Array(e.data.buffer);
    packetArray[0] = e.reportId;
    packetArray.push(...dataArray);
  
    switch (mtDeviceType) {
      case "CMF":
        EmitObject({Name: "OnError",
          Source: "DeviceType",
          Data: "Not Implemented"
        });
        break;
      case "MMS":
        EmitObject({Name:"OnError",
          Source: "DeviceType",
          Data: "Use the MMS Parser"
        });
        break;
      case "V5":
        parseV5Packet(packetArray);
        break;
      default:
        EmitObject({Name: "OnError",
          Source: "DeviceType",
          Data: "Unknown Device Type"
        });
        break;
    }
  }
  