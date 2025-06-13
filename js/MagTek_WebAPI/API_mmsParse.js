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

import * as mt_Utils from "./mt_utils.js";
import "./mt_events.js";

export let LogMMStoConsole = false;
export let LogMMStoEvent = false;

let data_buffer_response = [];

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}


export function parseMMSPacket(data) {
  let subdata = [];
  switch (data[0]) {
    case 0x00:
      subdata = parseSinglePacket(data);
      EmitObject({
        Name: "OnMMSMessage",
        Data: mt_Utils.toHexString(subdata)
      });
      ParseMMSMessage(subdata);
      break;
    case 0x01:
      parseHeadPacket(data);
      break;
    case 0x02:
      parseMiddlePacket(data);
      break;
    case 0x03:
      subdata = parseTailPacket(data);
      EmitObject({
        Name: "OnMMSMessage",
        Data: mt_Utils.toHexString(subdata)
      });
      ParseMMSMessage(subdata);
      
      break;
    case 0x04:
      parseCancelPacket(data);
      break;
    default:
      EmitObject({
        Name: "OnError",
        Source: "ParseMMSPacketError",
        Data: data,
      });
  }
}

export function ParseMMSResponseMessage(Msg) {
  const MMSResponseMessage = {
    MsgHeader: Msg.MsgHeader,
    MsgVersion: Msg.MsgVersion,
    MsgType: Msg.MsgType,
    RefNum: Msg.RefNum,
    RespID: Msg.RespID,
    TLVData: Msg.TLVData,
    HexString: Msg.HexString,
    OperationStatus: parseOpStatus(Msg),
    OperationDetail: parseOpDetail(Msg),
    OperationStatusCode: mt_Utils.getTagValue("82", "", Msg.TLVData, false).substring(0,2),
    OperationDetailCode: mt_Utils.getTagValue("82", "", Msg.TLVData, false).substring(2,8)
  };
return MMSResponseMessage;
}



export function ParseMMSMessage(Msg) {
  const MMSMessage = {
    MsgHeader: mt_Utils.makeHex(Msg[0], 2),
    MsgVersion: mt_Utils.makeHex(Msg[1], 2),
    MsgType: mt_Utils.makeHex(Msg[4], 2),
    RefNum: mt_Utils.makeHex(Msg[5], 2),
    RespID: mt_Utils.makeHex((Msg[6] << 8) | Msg[7], 4),
    TLVData: mt_Utils.toHexString(Msg.slice(8, Msg.length)),
    HexString: mt_Utils.toHexString(Msg),
  };


  if (LogMMStoConsole) {
    mt_Utils.debugLog("++++++++++++++++++++++++++++++++++++++++++++++++++++");
    mt_Utils.debugLog("Header: " + MMSMessage.MsgHeader);
    mt_Utils.debugLog("Version: " + MMSMessage.MsgVersion);
    mt_Utils.debugLog("MsgType: " + MMSMessage.MsgType);
    mt_Utils.debugLog("RefNum: " + MMSMessage.RefNum);
    mt_Utils.debugLog("RespID: " + MMSMessage.RespID);
    mt_Utils.debugLog("TLVData: " + MMSMessage.TLVData);
    mt_Utils.debugLog("HexString: " + MMSMessage.HexString);
    mt_Utils.debugLog("++++++++++++++++++++++++++++++++++++++++++++++++++++");
  }
  if (LogMMStoEvent) {
    EmitObject({
      Name: "OnDebug",
      Source: "MMSMessage",
      Data: JSON.stringify(MMSMessage),
    });
  }
  switch (MMSMessage.MsgType) {
    case "01":
      parseRequestFromHost(MMSMessage);
      break;
    case "02":
      parseResponseFromHost(MMSMessage);
      break;
    case "03":
      parseNotificationFromHost(MMSMessage);
      break;
    case "04":
      parseFileFromHost(MMSMessage);
      break;
    case "81":
      parseRequestFromDevice(MMSMessage);
      break;
    case "82":
      parseResponseFromDevice(MMSMessage);
      break;
    case "83":
      parseNotificationFromDevice(MMSMessage);
      break;
    case "84":
      parseFileFromDevice(MMSMessage);
      break;
    default:
      EmitObject({ Name: "OnError", Source: "MMSParseError", Data: Msg });
  }
}

function parseManualEntryDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let Detail = NotifyDetail.substring(2, 8);
  switch (Detail) {
    case "010100": //Manual Card Entry Data Entered
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnManualDataEntered", Data: NotifyDetail });
      break;
    case "100101":
      console.log(Msg.TLVData);
      break;
    case "080202": //Manual Card Entry ARQC
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnARQCData",
        Source: "Manual",
        Data: NotifyDetail.substring(12),
      });
      break;
    case "080302": //Manual Card Entry BatchData
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnBatchData",
        Source: "Manual",
        Data: NotifyDetail.substring(12),
      });
      break;
    default:
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnError",
        Source: "ManualError",
        Data: NotifyDetail,
      });
      break;
  }
}
function parseMSRDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let Detail = NotifyDetail.substring(2, 8);
  switch (Detail) {
    case "010100": //Swiped
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnMSRCardSwiped", Data: "Transaction in progress" });
      break;
    case "010200": //Inserted
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnMSRCardInserted",
        Data: "Transaction in progress",
      });
      break;
    case "010300": //Removed
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnMSRCardRemoved", Data: "Transaction in progress" });
      break;
    case "010400": //Detected
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnMSRCardDetected", Data: NotifyDetail });
      break;
    case "080202": //ARQC
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnARQCData",
        Source: "MSR",
        Data: NotifyDetail.substring(12),
      });
      break;
    case "080302": //BATCH
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnBatchData",
        Source: "MSR",
        Data: NotifyDetail.substring(12),
      });
      break;
    default:
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnError", Source: "MSRError", Data: NotifyDetail });
      break;
  }
}
function parseContactDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let Detail = NotifyDetail.substring(2, 8);
  switch (Detail) {
    case "010200": //Inserted
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnContactCardInserted",
        Data: "Transaction in progress",
      });
      break;
    case "010300": //Removed
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnContactCardRemoved",
        Data: "Transaction in progress",
      });
      break;
    case "010400": //Detected
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactCardDetected", Data: NotifyDetail });
      break;
    case "020601": //EMV Contact PINPad Error
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactPINPadError", Data: NotifyDetail });
      break;
    case "020602": //EMV Contact PIN Block Encryption Error
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactPINBlockError", Data: NotifyDetail });
      break;
    case "080202": //ARQC
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnARQCData",
        Source: "EMV",
        Data: NotifyDetail.substring(12),
      });
      break;
    case "080302": //BATCH
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnBatchData",
        Source: "EMV",
        Data: NotifyDetail.substring(12),
      });
      break;
    default:
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnError",
        Source: "ContactError",
        Data: NotifyDetail,
      });
      break;
  }
}

function parseContactlessDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let Detail = NotifyDetail.substring(2, 8);
  switch (Detail) {
    case "010300": //Removed
      NotifyDetail = Msg.TLVData;
      //EmitObject({Name:"OnContactlessCardRemoved",Data:NotifyDetail});
      EmitObject({
        Name: "OnContactlessCardRemoved",
        Data: "Transaction in progress",
      });
      break;
    case "010400": //EMV Detected
      NotifyDetail = Msg.TLVData;
      //EmitObject({Name:"OnContactlessCardDetected",Data:NotifyDetail});
      EmitObject({
        Name: "OnContactlessCardDetected",
        Data: "Transaction in progress",
      });
      break;
    case "010401": //Mifare Ultralight Detected
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnContactlessMifareUltralightCardDetected",
        Data: NotifyDetail,
      });
      break;
    case "010402": //Mifare Classic 1K
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnContactlessMifare1KCardDetected",
        Data: NotifyDetail,
      });
      break;
    case "010403": //Mifare Classic 4K
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnContactlessMifare4KCardDetected",
        Data: NotifyDetail,
      });
      break;
    case "010500": //Collision
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactlessCardCollision", Data: NotifyDetail });
      break;
    case "011002": //VAS Error
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactlessVASError", Data: NotifyDetail });
      break;
    case "020601": //PINPad Error
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactlessPINPadError", Data: NotifyDetail });
      break;
    case "020602": //PIN Block Error
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnContactlessPINBlockError", Data: NotifyDetail });
      break;
    case "080202": //ARQC
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnARQCData",
        Source: "NFC",
        Data: NotifyDetail.substring(12),
      });
      break;
    case "080302": //BATCH
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnBatchData",
        Source: "NFC",
        Data: NotifyDetail.substring(12),
      });
      break;
    case "080402": //NFC UID
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnContactlessNFCUID",
        Data: NotifyDetail.substring(18),
      });
      break;
    default:
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnError",
        Source: "ContactlessError",
        Data: NotifyDetail,
      });
      break;
  }
}

function parseBarcodeDetail(Msg) {
  console.log(Msg.HexData)
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let Detail = NotifyDetail.substring(2, 8);
  switch (Detail) {
    case "010100": //Barcode Read
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnBarcodeRead", Data: NotifyDetail });
      break;
    case "080002": //Barcode Update
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnBarcodeUpdate", Data: NotifyDetail });
      break;
    default:
      NotifyDetail = Msg.TLVData;
      EmitObject({
        Name: "OnError",
        Source: "BarcodeError",
        Data: NotifyDetail,
      });
      break;
  }
}

function parseNotificationFromDevice(Msg) {
  try {
    let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
    switch (Msg.RespID) {
      case "0101":
        let technology = NotifyDetail.substring(0, 2);
        switch (technology) {
          case "00":
            console.log(`Transaction started by Device:  ${Msg.HexString}`);
          case "07": //Manual Entry
            parseManualEntryDetail(Msg);
            break;
          case "08": //MSR
            parseMSRDetail(Msg);
            break;
          case "10": //EMV
            parseContactDetail(Msg);
            break;
          case "20": //EMV Contactless
            parseContactlessDetail(Msg);
            break;
          case "30": //Barcode
            parseBarcodeDetail(Msg);
            break;
          default:
            console.log(` Unknown Tech ${Msg.HexString}`);
            EmitObject({
              Name: "OnError",
              Source: "UnknownTechnology",
              Data: Msg,
            });
            break;
        }
        break;
      case "0103":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnTransactionHostAction", Data: NotifyDetail });
        break;
      case "0105":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnTransactionComplete", Data: NotifyDetail });
        break;
      case "0201":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnBankingNotification", Data: Msg.TLVData });
        break;
      case "0205":
        NotifyDetail = Msg.TLVData;
        let data = mt_Utils.getTagValue("F5", "", Msg.TLVData.substring(24), false); 
        let PBF = mt_Utils.getTagValue("DF71", "", data, false);
        let EPB = mt_Utils.getTagValue("99", "", data, false);
        let KSN = mt_Utils.getTagValue("DFDF41", "", data, false);
        let EncType = mt_Utils.getTagValue("DFDF42", "", data, false);
        EmitObject({ Name: "OnPINComplete", Data: { PBF:PBF,EPB:EPB,KSN:KSN,EncType:EncType, TLV:Msg.TLVData }});
        break;
      case "0905":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnFirmwareUpdateSuccessful", Data: NotifyDetail });
        break;
      case "0906":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnFirmwareUpdateFailed", Data: NotifyDetail });
        break;
      case "0907":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnFirmwareUptoDate", Data: NotifyDetail });
        break;
      case "1001":
        let category = NotifyDetail.substring(0, 2);
        switch (category) {
          case "00": //Power Reset
            parsePowerEventDetail(Msg);
            break;
          case "01": //User Event
            parseUserEventDetail(Msg);
            break;
          case "02":

          case "03": //Key Mgmt
            parseKeyEventDetail(Msg);
            break;
          default:
            break;
        }
        break;
      case "1801":
        NotifyDetail = Msg.TLVData;
        EmitObject({ Name: "OnUIInformationUpdate", Data: NotifyDetail });
        break;
      case "1803":
        NotifyDetail = Msg.TLVData;
        let Message = mt_Utils.hexToASCII(NotifyDetail.substring(44));
        EmitObject({ Name: "OnUIDisplayMessage", Data: Message });
        break;
      case "1805":        
        NotifyDetail = Msg.TLVData;
        
        window.mt_device_response = window.mt_device_delayedresponse;         
        EmitObject({ Name: "OnUIHostActionComplete", Data: NotifyDetail });
        EmitObject({ Name: "OnDeviceResponse", Data: window.mt_device_response });
        
        break;
      default:
        NotifyDetail = mt_Utils.toHexString(Msg.TLVData);
        EmitObject({
          Name: "OnError",
          Source: "Unknown Notification",
          Data: toHexString(Msg),
        });
        break;
    }
  } catch (error) {
    EmitObject({
      Name: "OnError",
      Source: "NotificationError",
      Data:  JSON.stringify(Msg) + error.Message
    });
  }
}

function parsePowerEventDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let Detail = NotifyDetail.substring(2, 6);
  switch (Detail) {
    case "0000": //Reset Occured
      EmitObject({ Name: "OnPowerEvent", Data: "Reset Occured" });
      break;
    case "0100": //Reset Soon
      EmitObject({ Name: "OnPowerEvent", Data: "Reset Soon" });
      break;
    case "0200": //Low Battery
      EmitObject({ Name: "OnPowerEvent", Data: "Low Battery" });
      break;
    case "0201": //Low Battery
      EmitObject({ Name: "OnPowerEvent", Data: "Low Battery" });
      break;
    case "0300": //Low Battery
      EmitObject({ Name: "OnPowerEvent", Data: "Reset" });
      break;
  }
}

function parseUserEventDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  let reasonValue = NotifyDetail.substring(2, 4);
  let xPos;
  let yPos;
  switch (reasonValue) {
    case "00": //Contactless Card Detected
      EmitObject({ Name: "OnContactlessCardDetected", Data: "Idle" });
      break;
    case "01": //Contactless Card Removed
      EmitObject({ Name: "OnContactlessCardRemoved", Data: "Idle" });
      break;
    case "02": //Card Seated in Slot
      EmitObject({ Name: "OnContactCardInserted", Data: "Idle" });
      break;
    case "03": //Card Unseated from Slot
      EmitObject({ Name: "OnContactCardRemoved", Data: "Idle" });
      break;
    case "04": //Card Swiped
      EmitObject({ Name: "OnMSRSwipeDetected", Data: "Idle" });
      break;
    case "05": //Touch Sensor Press On Display
      xPos = Number(`0x${Msg.TLVData.substring(24, 28)}`);
      yPos = Number(`0x${Msg.TLVData.substring(28, 32)}`);
      EmitObject({ Name: "OnTouchDown", Data: { Xpos: xPos, Ypos: yPos } });
      break;
    case "06": //Touch Sensor Release On Display
      xPos = Number(`0x${Msg.TLVData.substring(24, 28)}`);
      yPos = Number(`0x${Msg.TLVData.substring(28, 32)}`);
      EmitObject({ Name: "OnTouchUp", Data: { Xpos: xPos, Ypos: yPos } });
      break;
    case "07": //Barcode Detected
    console.log(Msg.HexString)
      NotifyDetail = mt_Utils.getTagValue("84", "", Msg.TLVData, false);
      EmitObject({
        Name: "OnBarcodeDetected",
        Data: NotifyDetail.substring(12),
      });
      break;
    default:
      NotifyDetail = Msg.TLVData;
      EmitObject({ Name: "OnUserEvent", Data: NotifyDetail });
      break;
  }
}
function parseKeyEventDetail(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  EmitObject({ Name: "OnKeyEvent", Data: NotifyDetail });
}

function parseNotificationFromHost(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  EmitObject({ Name: "OnNotificationFromHost", Data: NotifyDetail });
}
function parseRequestFromDevice(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  EmitObject({ Name: "OnRequestFromDevice", Data: NotifyDetail });
}
function parseResponseFromDevice(Msg) {

  const MMSResponse = ParseMMSResponseMessage(Msg);
  if (MMSResponse.RespID == "1805")
  {
    window.mt_device_delayedresponse = MMSResponse;
    EmitObject({ Name: "OnDeviceDelayedResponse", Data: MMSResponse });
  }
  else
  {
    window.mt_device_response = MMSResponse; 
    EmitObject({ Name: "OnDeviceResponse", Data: MMSResponse });
  }
  
}
function parseRequestFromHost(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  EmitObject({ Name: "OnRequestFromHost", Data: NotifyDetail });
}
function parseResponseFromHost(Msg) {
  let NotifyDetail = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  EmitObject({ Name: "OnHostResponse", Data: NotifyDetail });
}

function parseFileFromDevice(Msg) {  
  EmitObject({ Name: "OnFileFromDevice", Data: Msg });
}
function parseFileFromHost(Msg) {  
  EmitObject({ Name: "OnFileFromHost", Data: Msg });
}


function parseSinglePacket(packet) {
  //Entire message is in 1 packet no buufering required
  let respnseLen = packet[1];
  return packet.slice(2, respnseLen + 2);
}

function parseHeadPacket(packet) {
  //message is in more than 1 packet and this is the first
  data_buffer_response.length = 0; //Clear the buffer
  data_buffer_response.push(...packet.slice(5)); //Append this to the buffer
  return null;
}

function parseMiddlePacket(packet) {
  //message is in more than 1 packet and this is a middle packet
  data_buffer_response.push(...packet.slice(3)); //Append this to the buffer
  return null;
}
function parseTailPacket(packet) {
  //message is in more than 1 packet and this is the last packet
  let respnseLen = packet[1];
  data_buffer_response.push(...packet.slice(2, respnseLen + 2)); //Append this to the buffer
  return data_buffer_response;
}
function parseCancelPacket(packet) {
  //message is a cancel multi packet
  data_buffer_response.length = 0; //clear the buffer
  return null;
}

export function buildCmdsArray(commandstring, reportLen) {
  const usbEndpointID = "00";
  let MaxMsgDataLen = reportLen - 2;
  let FirstPacketDataLen = reportLen - 5;
  let MiddlePacketDataLen = reportLen - 3;

  let i = 0;
  let SliceSize = 0;
  let RemainingData = commandstring;
  let RemainingLength = 0;

  let packetType = "";
  let packetNumber = "";
  let msgLength = "";
  let DataSlice;

  let cmdArray = [];
  if (commandstring.length > MaxMsgDataLen * 2) {
    //Process multiple packets
    //Process first packet
    packetType = "01";
    msgLength = mt_Utils.makeHex(RemainingData.length / 2, 8);
    SliceSize = FirstPacketDataLen * 2;
    DataSlice = RemainingData.slice(0, SliceSize);
    cmdArray[i] = mt_Utils.hexToBytes(packetType + msgLength + DataSlice);
    RemainingData = RemainingData.slice(SliceSize);
    RemainingLength = RemainingData.length;

    while (RemainingLength > 0) {
      i++;
      if (RemainingLength > MaxMsgDataLen * 2) {
        //Process middle packets
        packetType = "02";
        packetNumber = mt_Utils.makeHex(i, 4);
        SliceSize = MiddlePacketDataLen * 2;
        DataSlice = RemainingData.slice(0, SliceSize);
        cmdArray[i] = mt_Utils.hexToBytes(
          packetType + packetNumber + DataSlice
        );
        RemainingData = RemainingData.slice(SliceSize);
        RemainingLength = RemainingData.length;
      } else {
        //Process tail packet
        packetType = "03";
        msgLength = mt_Utils.makeHex(RemainingData.length / 2, 2);
        cmdArray[i] = mt_Utils
          .hexToBytes(packetType + msgLength + RemainingData)
          .zeroFill(reportLen);
        RemainingLength = 0;
      }
    }
  } else {
    //process as single packet format
    packetType = "00";
    msgLength = mt_Utils.makeHex(commandstring.length / 2, 2);
    cmdArray[i] = mt_Utils
      .hexToBytes(packetType + msgLength + commandstring)
      .zeroFill(reportLen);
  }
  return cmdArray;
}

function parseOpStatus(Msg) {
  //we only parse Op Status for Device Responses.
  if (Msg.MsgType != "82") return "";
  let OpStatus = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
  switch (OpStatus.substring(0,2)) {
    case "00":
      return "OK, Success"
      break;      
    case "01":
      return "OK, Started"
      break;
    case "40":
      return "OK, With Warnings"
      break;
    case "41":
      return "OK, Started with Warnings"
      break;
    case "80":
      return "Failed to Start"
      break;
    case "81":
      return "Failed Operation"
      break;
    default:
      return "Unknown Operation Status"
      break;
    }
}

function parseOpDetail(Msg) {
//we only parse OpDetail for Device Responses.
if (Msg.MsgType != "82") return "";
let OpStatus = mt_Utils.getTagValue("82", "", Msg.TLVData, false);
switch (OpStatus.substring(2,8)) {
  case "000000":  
    return "OK - Requested Operation Successful"
    break;
  case "000002": 
    return "Requested Operation Failed"
    break;
  case "000010": 
    return "RTC Setup - Data and Time Failure"
    break;
  case "000011": 
    return "RTC Setup - Alarm failure"
    break;
  case "000012": 
    return "Key Generation Failure"
    break;
  case "000013": 
    return "Tamper Setting Locked, Cannot be Changed"
    break;
  case "000014": 
    return "Tamper Setting Requires System Reset"
    break;
  case "000015": 
    return "Tamper Status Cannot be Cleared, Failure"
    break;
  case "000016": 
    return "Device Tampered"
    break;
  case "000017": 
    return "Tamper Module Failed"
    break;
  case "000018": 
    return "Setting WLAN Soft-AP Password Failure"
    break;
  
  // ---- Message Handler ----
  
  case "010101": 
    return "Generic Failure"
    break;
  case "010102": 
    return "Bad Message Parameter. Message Not Constructed Properly"
    break;
  case "010109": 
    return "Device Offline, Cannot Process Messages"
    break;
  case "010110": 
    return "PIN Key Not Mapped"
    break;
  case "010113": 
    return "Feature Not Available"
    break;
  
  // ---- Request Handler ----
  
  case "020000": 
    return "Reserved"
    break;
  case "020100": 
    return "Reserved"
    break;
  case "020101": 
    return "Generic Failure"
    break;
  case "020102": 
    return "Bad Message Parameter"
    break;
  case "020103": 
    return "Response Payload Too Large"
    break;
  case "020107": 
    return "Internal Firmware Failure"
    break;
  case "02010A": 
    return "Image Failure"
    break;
  case "020119": 
    return "Key Does Not Exist"
    break;
  case "02011A": 
    return "Not Secured"
    break;
  case "02011B": 
    return "Passcode Validation Failed"
    break;
  case "02011C": 
    return "Device Locked"
    break;
  case "020200": 
    return "Reserved"
    break;
  case "020304": 
    return "Failed Device State, No Transaction"
    break;
  case "020305": 
    return "Failed Device State, Cannot Cancel"
    break;
  case "020308": 
    return "Failed Device State, Transaction in Progress"
    break;
  case "02030C": 
    return "Failed Device State, Signature Not Allowed"
    break;
  case "02030D": 
    return "Failed Device State, Incorrect Transaction State"
    break;
  case "02030E": 
    return "Failed Device State, Invalid PIN Entry State"
    break;
  case "02030F": 
    return "Failed Device State, PIN Entry in Session"
    break;
  case "020311": 
    return "Failed Device State, Barcode Read in Progress"
    break;
  case "020312": 
    return "Failed Device State, Pass-through Command Not Activated"
    break;
  case "020314": 
    return "Failed Device State, UI Settings in Progress"
    break;
  case "020315": 
    return "Failed Device State, Buzzer in Progress"
    break;
  case "020316": 
    return "Failed Device State, Low Battery (5% or less)"
    break;
  case "020413": 
    return "Failed, BCR Hardware Not Found"
    break;
  case "020501": 
    return "Invalid TR31 Parameter"
    break;
  case "020502": 
    return "Invalid AES length"
    break;
  case "020503": 
    return "Invalid 16-Byte Boundary"
    break;
  case "020504": 
    return "Invalid Length in Message"
    break;
  case "020505": 
    return "Invalid number of optional KBH"
    break;
  case "020506": 
    return "Error Data Type Conversion"
    break;
  case "020507": 
    return "Invalid KCV algorithm"
    break;
  case "020508": 
    return "Invalid KCV length"
    break;
  case "020509": 
    return "Invalid Optional KBH ID"
    break;
  case "02050A": 
    return "Invalid KBH ID"
    break;
  case "02050B": 
    return "Invalid algorithm used in KBH"
    break;
  case "02050C": 
    return "Invalid KBH usage"
    break;
  case "02050D": 
    return "Invalid KBH length"
    break;
  case "02050E": 
    return "Invalid version ID for Key Derivation"
    break;
  case "02050F": 
    return "Invalid KBH Use-Mode"
    break;
  case "020510": 
    return "TR31 Engine Not Installed"
    break;
  case "020511": 
    return "Invalid Cryptographic Operation"
    break;
  case "020512": 
    return "MAC Verification Failed"
    break;
  case "020513": 
    return "Error in Decrypting Key Data"
    break;
  case "020514": 
    return "Error in Computing MAC Message"
    break;
  case "020515": 
    return "Invalid MAC length"
    break;
  case "020516": 	
    return "KDF Error"
    break;
  case "020517": 
    return "Buffer Insufficient"
    break;
  case "020518": 
    return "Invalid Storage KPM"
    break;
  case "020519": 
    return "Invalid Storage Secure RAM"
    break;
  case "02051A": 
    return "Invalid Key ID Specified in Option Block"
    break;
  case "02051B": 
    return "Unsupported Key ID specified in Option Block"
    break;
  case "02051C": 
    return "Invalid Key ID Relationship"
    break;
  case "02051D": 
    return "Protection Key ID not loaded"
    break;
  case "02051E": 
    return "Invalid Data Tag MagTek Custom Option Block"
    break;
  case "02051F": 
    return "Invalid KCV"
    break;
  case "020520": 
    return "Invalid Data"
    break;
  case "020521": 
    return "Invalid DUKPT key derivation"
    break;
  case "020522": 
    return "Invalid Exportability"
    break;
  case "020523": 
    return "Invalid Key Class"
    break;
  case "020524": 
    return "Invalid DSN"
    break;
  case "020525": 
    return "Invalid Challenge"
    break;
  case "020526": 
    return "Key Undeletable"
    break;
  case "020527": 
    return "Key Not Present"
    break;
  case "020528": 
    return "Unsupported Keyset ID"
    break;
  case "020529": 
    return "KPM Error"
    break;
  case "02052A": 
    return "Secure RAM Error"
    break;
  case "02052B": 
    return "Duplicated Key"
    break;
  case "02052C": 
    return "Invalid Key Usage Rule"
    break;
  case "02052D": 
    return "Self-test Key Corrupted"
    break;
  case "02052E": 
    return "Self-test System Key Bitmap Corrupted"
    break;
  case "02052F": 
    return "Self-test System Key Missing"
    break;
  case "020530": 
    return "Self-test System Key Not Loaded"
    break;
  case "020531": 
    return "Invalid Key Storage Limit"
    break;
  case "020532": 
    return "Duplicated Key Set"
    break;
  case "020533": 
    return "Key Restriction"
    break;
  case "020534": 
    return "Key Transported by Weaker key"
    break;
  case "020535": 
    return "Repeat Key Agreement"
    break;
  case "020536": 
    return "Security Not Activated"
    break;
  case "020537": 
    return "Self-test Key Relocated"
    break;
  case "020538": 
    return "Invalid Self-test Scanned Versus Saved Bitmap"
    break;
  default:
    return "Unknown Operation Detail"
    break;
  }  
};


Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};

