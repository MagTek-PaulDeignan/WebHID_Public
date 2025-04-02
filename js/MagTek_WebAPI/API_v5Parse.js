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
let data_Buffer_Report = "";
let data_Buffer_Response = "";


let technology = "";



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

export function parseExtendedReport(report) {
  let report_id = report.substring(0, 2);
  let report_rc = report.substring(2, 4);
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
  //mt_Utils.debugLog("Extend Response: " + response);
  //mt_Utils.debugLog("respnseCode: " + respnseCode);
  //mt_Utils.debugLog("part_data_len: " + part_data_len);
  //mt_Utils.debugLog("offset: " + offset);
  //mt_Utils.debugLog("response_rc: " + response_rc);
  //mt_Utils.debugLog("msg_data_len: " + msg_data_len);
  //mt_Utils.debugLog("msg_data: " + msg_data);
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

function buildCmdArray(commandstring, reportLen) {
  let cmdArray = mt_Utils.hexToBytes(commandstring).zeroFill(reportLen);
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
  let command = mt_Utils.hexToBytes(commandStr);
  let data = mt_Utils.hexToBytes(dataStr);
  let result = [];
  const MAX_DATA_LEN = 60;
  let commandLen = 0;
  let dataLen = 0;
  if (command != null) {
    commandLen = command.length;
  }
  if (commandLen != 2) {
    return null;
  }
  if (data != null) {
    dataLen = data.length;
  }
  let offset = 0;
  while (offset < dataLen || dataLen == 0) {
    let len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    let extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    let i;
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
  let command = mt_Utils.hexToBytes(commandStr);
  let result = [];
  const MAX_DATA_LEN = 60;
  let commandLen = 0;
  let dataLen = parseInt(commandStr.substring(4, 8), 16);
  let offset = 0;
  while (offset < dataLen || dataLen == 0) {
    let len = dataLen - offset;
    if (len >= MAX_DATA_LEN - 8) {
      len = MAX_DATA_LEN - 9;
    }
    let extendedCommand = new Array(8 + len);
    extendedCommand[0] = 0x49;
    extendedCommand[1] = 6 + len;
    extendedCommand[2] = (offset >> 8) & 0xff;
    extendedCommand[3] = offset & 0xff;
    extendedCommand[4] = command[0];
    extendedCommand[5] = command[1];
    extendedCommand[6] = (dataLen >> 8) & 0xff;
    extendedCommand[7] = dataLen & 0xff;
    let i;
    for (i = 0; i < len; i++) {
      extendedCommand[8 + i] = command[4 + offset + i];
    }
    offset += len;
    result.push(mt_Utils.toHexString(extendedCommand));

    if (dataLen == 0) break;
  }
  return result;
}







export function processMsgType(msg) {

     EmitObject({
       Name: "OnV5Message",
       Data: msg
     });
    


  let msgType = "";
  switch (msg.substring(0, 2)) {
    case "00": //Device  Response
      msgType = "Device Response";
      processDeviceResponseMsg(msgType, msg);
      break;
    case "01": //MSR Notification
      msgType = "MSR Notification";
      processMSRDataMsg(msgType, msg.substring(2));
      break;
    case "02": //Device Notification
      msgType = "Device Notification";
      processNotificationMsg(msgType, msg);
      break;
    case "0A": //Device  Extended Response
      msgType = "Device Extended Response";
      processDeviceExtendedResponseMsg(msgType, msg);
      break;
    default: //Unknown
      msgType = "Unknown";
      processUnknownMsg(msgType, msg);
  }
}

function processDeviceResponseMsg(messageType, msg) {
  EmitObject({ Name: "OnV5DeviceResponse", Data: msg });
}

function processDeviceExtendedResponseMsg(messageType, msg) {
  EmitObject({ Name: "OnV5DeviceResponse", Data: msg });
}

function processMSRDataMsg(messageType, msg) {
    let ParsedMSR = ParseMSR(mt_Utils.hexToBytes(msg));
    EmitObject({ Name: "OnV5MSRSwipe", Data: ParsedMSR });
}

function processNotificationMsg(messageType, msg) {
  processNotificationType(msg);
}


function processNotificationType(msg) {
  let notifyType = "";
  let hexstring = ""
  let ASCIIString = "";
  switch (msg.substring(2, 6)) {
    case "0300":
      notifyType = "Transaction Status Notification";
      hexstring = msg.substring(10);
      processTransactionStatus(hexstring);
      break;
    case "0301":
      notifyType = "Display Message Notification";
      hexstring = msg.substring(10);
      ASCIIString = mt_Utils.hexToASCII(hexstring);
      EmitObject({ Name: "OnUIDisplayMessage", Data: ASCIIString });
      break;
    case "0302":
      notifyType = "User Selection Notification";
      hexstring = msg.substring(14);
      ASCIIString = mt_Utils.hexToASCIInulltoNewLine(hexstring);
      EmitObject({ Name: "OnUserSelection", Source: "V5", Data: ASCIIString });
      break;
    case "0303":
      notifyType = "ARQC Notification";
      hexstring = msg.substring(10);
      EmitObject({ Name: "OnARQCData", Source: technology, Data: hexstring });
      break;
    case "0304":
      notifyType = "Transaction Result Notification";
      hexstring = msg.substring(12); //skip over Signature Required byte
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
      hexstring = msg.substring(12);
      //processNotificationType(hexstring);
      EmitObject({ Name: "OnUARTData", Source: "V5", Data: hexstring });

      break;
    case "0500":
      notifyType = "SPI Notification - DAV";
      //let len = parseInt(msg.substring(6, 10), 16);
      hexstring = msg.substring(12);
      EmitObject({ Name: "OnSPIData", Source: "V5", Data: hexstring });
      break;
     case "0600":  
       notifyType = "Firmware Load Status";
       hexstring = msg.substring(6);    
       EmitObject({ Name: "OnFirmwareLoadStatus", Source: "V5", Data: hexstring });
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
  let outString = "";
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
      outString = outString + "; " + " No Application Interchange Profile (Tag 82) Received";
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
//     Remaining_MSR_Transactions: mt_Utils.toHexString(cardDataBytes.slice(856, 859)),
//     MagneSafe_Version_Number: mt_Utils.toHexString(cardDataBytes.slice(859, 867)),
//     HID_Report_Version: mt_Utils.toHexString(cardDataBytes.slice(867, 887)),
//     MagnePrint_KSN: cardDataBytes.slice(920, 930),
//     Battery_Level: cardDataBytes.slice(930)


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