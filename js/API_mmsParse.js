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
export function ParseMMSMessage(Msg) {
  const MMSMessage = {
    MsgHeader: mt_Utils.makeHex(Msg[0], 2),
    MsgVersion: mt_Utils.makeHex(Msg[1], 2),
    MsgType: mt_Utils.makeHex(Msg[4], 2),
    RefNum: mt_Utils.makeHex(Msg[5], 2),
    RespID: mt_Utils.makeHex((Msg[6] << 8) | Msg[7], 4),
    TLVData: mt_Utils.toHexString(Msg.slice(8, Msg.length)),
    HexString: mt_Utils.toHexString(Msg)
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
      NotifyDetail = Msg.TLVData;
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
        EmitObject({ Name: "OnUIHostActionComplete", Data: NotifyDetail });
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
  let NotifyDetail = Msg.TLVData;
  window.mt_device_response = Msg; 
  EmitObject({ Name: "OnDeviceResponse", Data: Msg });  
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


Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};
