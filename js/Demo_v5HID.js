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

import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";
import * as mt_Device from "./MagTek_WebAPI/API_v5HID.js";
import * as mt_RMS from "./MagTek_WebAPI/mt_rms_v5.js";
import * as mt_RMS_API from "./MagTek_WebAPI/API_rms.js";
import * as mt_UI from "./mt_ui.js";
import "./MagTek_WebAPI/mt_events.js";

let retval = "";
export let _openTimeDelay = 2000;

// these will need to be changed and are here for testing
let defaultRMSURL = '';
let defaultRMSAPIKey = '';
let defaultRMSProfileName = '';

document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);
document
  .querySelector("#sendCommand")
  .addEventListener("click", handleSendCommandButton);
document
  .querySelector("#clearCommand")
  .addEventListener("click", handleClearButton);
document
  .querySelector("#CommandList")
  .addEventListener("change", mt_UI.FromListToText);
document.addEventListener("DOMContentLoaded", handleDOMLoaded);

async function handleDOMLoaded() {
  mt_UI.ClearLog();
  let devices = await mt_Device.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0 ) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");

  });

  navigator.hid.addEventListener("connect", async ({ device }) => {
    EmitObject({Name:"OnDeviceConnect", Device:device});
    if (window.mt_device_WasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
  });

  navigator.hid.addEventListener("disconnect", ({ device }) => {
    EmitObject({Name:"OnDeviceDisconnect", Device:device});
  });
};

async function handleCloseButton() {
  mt_Device.closeDevice();  
  mt_UI.ClearLog();  
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
}

async function handleOpenButton() {
  window.mt_device_hid = await mt_Device.openDevice();
  
  //dont set date or USB output if in Bootloader '0x5357'
  if(window.mt_device_hid.productId != 0x5357){
    let Response = await mt_Device.sendCommand(mt_Device.calcDateTime());  //Set Date and Time
    if (Response != "0A06000000000000") mt_UI.LogData(`Error Setting Date: ${Response}`);
    Response = await mt_Device.sendCommand("480100");   //SET USB Output Channel
    if (Response != "0000") mt_UI.LogData(`Error Setting USB Output: ${Response}`);
  }
}

async function handleSendCommandButton() {
    let data = document.getElementById("sendData");
    let resp = await parseCommand(data.value);  
  }

async function parseCommand(message) {
  let Response ;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      //mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);
      return appOptions.version;
      break;
    case "GETSPIDATA":
      let spiCMD = "00" + "F".repeat(cmd[1] * 2);
      mt_Device.sendExtendedCommand("0500", spiCMD);
      break;
    case "GETDEVINFO":
      //return mt_HID.getDeviceInfo();
      break;
    case "SENDCOMMAND":
      Response = await mt_Device.sendCommand(cmd[1]);
      return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "SENDDATETIME":
      Response = await mt_Device.sendCommand(mt_Device.calcDateTime()); 
      return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "SENDEXTENDEDCOMMAND":
      Response = await mt_Device.sendExtendedCommand(cmd[1], cmd[2]);
      return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "SENDEXTCOMMAND":
      Response = await mt_Device.sendExtCommand(cmd[1]);
      return EmitObject({ Name: "OnV5DeviceResponse", Data: Response });
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();
      break;
    case "OPENDEVICE":
      window.mt_device_hid = await mt_Device.openDevice();
      break;
    case "CLOSEDEVICE":
      window.mt_device_hid = await mt_Device.closeDevice();        
      break;
    case "WAIT":
      mt_UI.LogData(`Waiting ${cmd[1]/1000} seconds...`);
      await mt_Utils.wait(cmd[1]);
      mt_UI.LogData(`Done Waiting`);
      break;
    case "DETECTDEVICE":
      await mt_Device.closeDevice();
      window.mt_device_hid = await mt_Device.openDevice();      
      await mt_Utils.wait(_openTimeDelay);
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);mt
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);
      mt_UI.LogData(`Get Tags for ${retval}`);      
      break;
    case "PARSETLV":
      retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "UPDATEDEVICE":
      mt_RMS_API.setURL(mt_Utils.getEncodedValue('RMSBaseURL',defaultRMSURL));
      mt_RMS_API.setAPIKey(mt_Utils.getEncodedValue('RMSAPIKey',defaultRMSAPIKey));
      mt_RMS_API.setProfileName(mt_Utils.getEncodedValue('RMSProfileName',defaultRMSProfileName));
      if(mt_RMS_API.BaseURL.length > 0 && mt_RMS_API.APIKey.length > 0 && mt_RMS_API.ProfileName.length > 0){
        await mt_RMS.updateDevice();
      }else{
        mt_UI.LogData(`Please set APIKey and ProfileName`);      
      }
      break;
    case "TESTBOOTLOADER":
      if(window.mt_device_hid.productId != 0x5357)
        {
          mt_UI.LogData(`Switching to Bootloader... `);      
          await mt_Device.sendCommand("6800");
          await mt_Utils.wait(3000);
          if (document.getElementById("lblUSBStatus").innerText.toLowerCase() == "opened")          
          {
            await mt_Device.sendCommand("7100");
            mt_UI.LogData(`Success: You have paired the Bootloader`);            
          }
          else
          {
            mt_UI.LogData(`Press the 'Open' button to 'permit' access to the Bootloader and repeat the test`);            
          }
          
        }else
        {
          await mt_Device.sendCommand("7100");
          mt_UI.LogData(`Exiting the Bootloader`);
          mt_UI.LogData(`Please repeat the test`);
        }
        break;
      

    case "UPDATEPROGRESS":
      mt_UI.updateProgressBar(cmd[1],cmd[2])  
      break;
    default:
      mt_UI.LogData(`Unknown Parse Command: ${cmd[0]}`);    
  }
}


function ClearAutoCheck() {
  let chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

const deviceConnectLogger = (e) => {
  mt_UI.setUSBConnected("Connected");
};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
};
const deviceOpenLogger = (e) => {
  mt_RMS.setDeviceDetected(true);
  mt_UI.setUSBConnected("Opened");
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};
const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
};

const v5eventLogger = (e) => {
  mt_UI.LogData(`V5 Event: ${e.Name}: ${e.Data}`);
};
const trxCompleteLogger = (e) => {
  mt_UI.LogData(`Transaction Complete: ${e.Name}: ${e.Data}`);
};
const displayMessageLogger = (e) => {
  //mt_UI.LogData(`Display: ${e.Data}`);
  mt_UI.DeviceDisplay(e.Data);
};

const displayRMSLogger = (e) => {
  mt_UI.LogData(`RMS Display: ${e.Data}`);
};

const displayRMSProgressLogger = (e) => {  
  mt_UI.updateProgressBar(e.Data.Caption, e.Data.Progress)
};

const displayFirmwareLoadStatusLogger = (e) => {  
  mt_UI.LogData(`RMS Firmware Load Status: ${e.Data}`);
};


const displayUserSelectionLogger = (e) =>{
  mt_UI.LogData(`Language/App Selection: ${e.Data}`);
}

const barcodeLogger = (e) => {
  //mt_UI.LogData(`Barcode  Data: ${e.Data}`);
  mt_UI.LogData(`Barcode  Data: ${mt_Utils.getTagValue("DF74", "", e.Data, true)}`);
};

const arqcLogger = (e) => {
  mt_UI.LogData(`${e.Source} ARQC Data:  ${e.Data}`);
  let TLVs = mt_Utils.tlvParser(e.Data.substring(4));
   mt_UI.PrintTLVs(TLVs);
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};

const fromDeviceLogger = (e) => {
  mt_UI.LogData(`Device Response: ${e.Data.TLVData}`);
};
const fromV5DeviceLogger = (e) => {
  mt_UI.LogData(`V5 Device Response: ${e.Data}`);
};
const inputReportLogger = (e) => {
  //mt_UI.LogData(`Input Report: ${e.Data}`);
};

const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};

const touchUpLogger = (e) => {
  let chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Up: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};
const touchDownLogger = (e) => {
  let chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Down: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};

const contactlessCardDetectedLogger = async (e) => {};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);

  let _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting EMV...`);
    await mt_Device.sendCommand("491900000300001303028000000000100000000000000000084002");    
  }
};

const contactCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle"){
    mt_UI.LogData(`Contact Card Removed`);
    mt_UI.DeviceDisplay("");
  } 

};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected ${e.Data}`);
  let chk = document.getElementById("chk-AutoMSR");
  let _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const V5MSRSwipeLogger = (e) =>{
  mt_UI.LogData(`MSR Swiped ${e.Name}`);
  mt_UI.LogData(`${JSON.stringify(e.Data,null, 2)}`);  
}


function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}

// Subscribe to  events
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);

EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);

EventEmitter.on("OnBarcodeDetected", barcodeLogger);
EventEmitter.on("OnBarcodeRead", dataLogger);
EventEmitter.on("OnBarcodeUpdate", dataLogger);

EventEmitter.on("OnARQCData", arqcLogger);
EventEmitter.on("OnBatchData", batchLogger);

EventEmitter.on("OnContactCardDetected", dataLogger);
EventEmitter.on("OnContactPINBlockError", dataLogger);
EventEmitter.on("OnContactPINPadError", dataLogger);

EventEmitter.on("OnContactlessCardCollision", dataLogger);
EventEmitter.on("OnContactlessMifare1KCardDetected", dataLogger);
EventEmitter.on("OnContactlessMifare4KCardDetected", dataLogger);
EventEmitter.on("OnContactlessMifareUltralightCardDetected", dataLogger);
EventEmitter.on("OnContactlessNFCUID", dataLogger);
EventEmitter.on("OnContactlessPINBlockError", dataLogger);
EventEmitter.on("OnContactlessPINPadError", dataLogger);
EventEmitter.on("OnContactlessVASError", dataLogger);

EventEmitter.on("OnFirmwareUpdateFailed", dataLogger);
EventEmitter.on("OnFirmwareUpdateSuccessful", dataLogger);
EventEmitter.on("OnFirmwareUptoDate", dataLogger);

EventEmitter.on("OnManualDataEntered", dataLogger);
EventEmitter.on("OnManualError", dataLogger);

EventEmitter.on("OnMSRCardDetected", dataLogger);
EventEmitter.on("OnMSRCardInserted", dataLogger);
EventEmitter.on("OnMSRCardRemoved", dataLogger);
EventEmitter.on("OnMSRCardSwiped", dataLogger);

EventEmitter.on("OnPowerEvent", dataLogger);

EventEmitter.on("OnTransactionComplete", trxCompleteLogger);
EventEmitter.on("OnTransactionHostAction", dataLogger);

EventEmitter.on("OnUIHostActionComplete", dataLogger);
EventEmitter.on("OnUIHostActionRequest", dataLogger);
EventEmitter.on("OnUIInformationUpdate", dataLogger);

EventEmitter.on("OnUserEvent", userEventLogger);

EventEmitter.on("OnContactlessCardDetected", contactlessCardDetectedLogger);
EventEmitter.on("OnContactlessCardRemoved", contactlessCardRemovedLogger);
EventEmitter.on("OnContactCardInserted", contactCardInsertedLogger);
EventEmitter.on("OnContactCardRemoved", contactCardRemovedLogger);
EventEmitter.on("OnMSRSwipeDetected", msrSwipeDetectedLogger);

EventEmitter.on("OnDeviceResponse", fromDeviceLogger);
EventEmitter.on("OnTouchDown", touchDownLogger);
EventEmitter.on("OnTouchUp", touchUpLogger);

EventEmitter.on("OnError", errorLogger);
EventEmitter.on("OnPINComplete", PINLogger);
EventEmitter.on("OnUIDisplayMessage", displayMessageLogger);

EventEmitter.on("OnV5Event", v5eventLogger);
EventEmitter.on("OnV5DeviceResponse", fromV5DeviceLogger);
EventEmitter.on("OnUserSelection", displayUserSelectionLogger);

EventEmitter.on("OnRMSLogData", displayRMSLogger);
EventEmitter.on("OnRMSProgress", displayRMSProgressLogger);
EventEmitter.on("OnFirmwareLoadStatus", displayFirmwareLoadStatusLogger);

EventEmitter.on("OnV5MSRSwipe", V5MSRSwipeLogger);
