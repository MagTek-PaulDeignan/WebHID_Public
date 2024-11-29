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
import * as mt_MMS from "./mt_mms.js";
import * as mt_HID from "./mt_hid.js";
import * as mt_UI from "./mt_ui.js";
import * as mt_RMS from "./mt_rms_mms.js";
import * as mt_RMS_API from "./mt_rms_api.js";
import "./mt_events.js";

let defaultRMSURL = '';
let defaultRMSAPIKey = '';
let defaultRMSProfileName = '';


let _contactSeated = false;
let _AwaitingContactEMV = false;
export let _contactlessDelay = parseInt(mt_Utils.getDefaultValue("ContactlessDelay", "500"));
export let _openTimeDelay = 1500;

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

document.getElementById('fileInput')
  .addEventListener('change', handleFileUpload);

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

async function handleDOMLoaded() {
  let devices = await mt_HID.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });



  //Add the hid event listener for connect/plug in
  navigator.hid.addEventListener("connect", async ({ device }) => {
    EmitObject({Name:"OnDeviceConnect", Device:device});
    if (window.mt_device_WasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
  });

  //Add the hid event listener for disconnect/unplug
  navigator.hid.addEventListener("disconnect", ({ device }) => {
    EmitObject({Name:"OnDeviceDisconnect", Device:device});
  });
}

async function handleCloseButton() {
  mt_HID.closeDevice();
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  document.getElementById("fileInput").value = null;
}

async function handleOpenButton() {
  window.mt_device_hid = await mt_HID.openDevice();
}

async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}

async function parseCommand(message) {
  let Response;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      Response = await mt_MMS.sendCommand(cmd[1]);
      mt_UI.LogData(Response.HexString)
      break;
    case "PCIRESET":
      Response = await mt_MMS.sendCommand("AA00810401121F0184021F01");      
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":
      window.mt_device_hid = await mt_HID.openDevice();      
      break;
    case "CLOSEDEVICE":
      window.mt_device_hid = await mt_HID.closeDevice();
      break;
    case "WAIT":
      mt_UI.LogData(`Waiting ${cmd[1]/1000} seconds...`);
      await mt_Utils.wait(cmd[1]);
      //mt_UI.LogData(`Done Waiting`);
      break;
    case "DETECTDEVICE":
      window.mt_device_hid = await mt_HID.openDevice();      
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      var retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);
      mt_UI.LogData(retval);
      break;
    case "PARSETLV":
      var retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "PARSEMMS":
      var retval = mt_Utils.MMSParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    case "GETDEVICESN":
      var sn = await mt_MMS.GetDeviceSN();
      mt_UI.LogData(sn);
      break;
    case "GETFIRMWAREID":
      var fw = await mt_MMS.GetDeviceFWID();
      mt_UI.LogData(fw);
      break;
    case "UPDATEDEVICE":
      mt_RMS_API.setURL(mt_Utils.getEncodedValue('baseURL',defaultRMSURL));
      mt_RMS_API.setAPIKey(mt_Utils.getEncodedValue('APIKey',defaultRMSAPIKey));
      mt_RMS_API.setProfileName(mt_Utils.getEncodedValue('ProfileName',defaultRMSProfileName));
      fw = await mt_MMS.GetDeviceFWID();
      sn = await mt_MMS.GetDeviceSN();

      mt_RMS.setFWID(fw);
      mt_RMS.setDeviceSN(sn);

      if(mt_RMS_API.BaseURL.length > 0 && mt_RMS_API.APIKey.length > 0 && mt_RMS_API.ProfileName.length > 0){
        await mt_RMS.updateDevice();
      }else{
        mt_UI.LogData(`Please set APIKey and ProfileName`);      
      }
      break;
    default:
      mt_Utils.debugLog("Unknown Command");
  }
};

function ClearAutoCheck() {
  var chk = document.getElementById("chk-AutoStart");
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
  mt_UI.setUSBConnected("Opened");
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const NFCUIDLogger = (e) => {
  mt_UI.LogData(`Received NFC UID : ${e.Name}: ${e.Data}`);
  mt_MMS.sendCommand("AA00810401641100840B1100810160820100830100");
  mt_MMS.sendCommand("AA00810401671100840D110081033A04278201008301FF");

};


const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
  
  let TLVs = mt_Utils.tlvParser(e.Data.TLV.substring(24));
  mt_UI.LogData("TLVs---------------------------------");
  TLVs.forEach(element => {
    mt_UI.LogData(`${element.tag} : ${element.tagValue} `);    
  });   
  mt_UI.LogData("TLVs---------------------------------");

};

const trxCompleteLogger = (e) => {
  mt_UI.LogData(`${e.Name}: ${e.Data}`);
};
const displayMessageLogger = (e) => {
  mt_UI.LogData(`Display: ${e.Data}`);
  mt_UI.DeviceDisplay(e.Data);
};
const barcodeLogger = (e) => {
  //mt_UI.LogData(`Barcode  Data: ${e.Data}`);
  mt_UI.LogData(`Barcode  Data: ${mt_Utils.getTagValue("DF74", "", e.Data, true)}`);
};
const arqcLogger = (e) => {
  mt_UI.LogData(`${e.Source} ARQC Data:  ${e.Data}`);
   let TLVs = mt_Utils.tlvParser(e.Data.substring(4));
   mt_UI.LogData("TLVs---------------------------------");
   TLVs.forEach(element => {
     mt_UI.LogData(`${element.tag} : ${element.tagValue} `);    
   });   
   mt_UI.LogData("TLVs---------------------------------");
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};
const fromDeviceLogger = (e) => {
  //mt_UI.LogData(`Device Response: ${e.Data.HexString}`);
};
const inputReportLogger = (e) => {
  mt_UI.LogData(`Input Report: ${e.Data}`);
};
const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const debugLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const touchUpLogger = (e) => {
  var chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Up: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};

const touchDownLogger = (e) => {
  var chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Down: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};

const contactlessCardDetectedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Detected`);
  var chk = document.getElementById("chk-AutoNFC");
  var chkEMV = document.getElementById("chk-AutoEMV");  
  var _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting...`);
    if (chkEMV.checked) {
      _AwaitingContactEMV = true;
      mt_UI.LogData(`Delaying Contactless ${_contactlessDelay}ms`);
      await mt_Utils.wait(_contactlessDelay);
    }
    if (!_contactSeated) {
      _AwaitingContactEMV = false;
      // We didn't get a contact seated, do start the contactless transaction
      //mt_MMS.sendCommand("AA008104010010018430100182010AA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840");      
      mt_MMS.sendCommand("AA00810401031001843D1001820178A3098101008201008301038402020386279C01009F02060000000001009F03060000000000005F2A0208405F3601029F150200009F530100");
    }
  }
};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = (e) => {
  _contactSeated = true;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);
  var chk = document.getElementById("chk-AutoEMV");
  var _autoStart = document.getElementById("chk-AutoStart");
  if (
    _autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle") ||
    _AwaitingContactEMV
  ) {
    _AwaitingContactEMV = false;
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting EMV...`);
    mt_MMS.sendCommand(
      "AA008104010010018430100182010AA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840"
    );
  }
};

const contactCardRemovedLogger = (e) => {
  _contactSeated = false;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Removed`);
};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected ${e.Data}`);
  var chk = document.getElementById("chk-AutoMSR");
  var _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting MSR...`);
    mt_MMS.sendCommand(
      "AA008104010010018430100182010AA30981010182010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840"
    );
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const fileLogger = (e) => {
  //mt_UI.LogData(`File: ${e.Data.HexString}`);
};


async function handleFileUpload(event) {
  if( event.target.files.length ==1 )
  {
    const file = event.target.files[0];

    const reader = new FileReader();
  
    reader.onload = async function(e) {
      const lines = e.target.result.split('\n');
      for (const line of lines) 
        {
        // Process each line here
        await parseCommand(line);
        
        }
    };
  reader.readAsText(file); 
};
}


const displayRMSLogger = (e) => {
  mt_UI.LogData(`RMS Display: ${e.Data}`);
};

const displayRMSProgressLogger = (e) => {  
  mt_UI.updateProgressBar(e.Data.Caption, e.Data.Progress)
};

const displayFirmwareLoadStatusLogger = (e) => {  
  mt_UI.LogData(`RMS Firmware Load Status: ${e.Data}`);
};



// Subscribe to  events
EventEmitter.on("OnInputReport", inputReportLogger);
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
EventEmitter.on("OnContactlessNFCUID", NFCUIDLogger);
EventEmitter.on("OnContactlessPINBlockError", dataLogger);
EventEmitter.on("OnContactlessPINPadError", dataLogger);
EventEmitter.on("OnContactlessVASError", dataLogger);

EventEmitter.on("OnFirmwareUpdateFailed", dataLogger);
EventEmitter.on("OnFirmwareUpdateSuccessful", dataLogger);
EventEmitter.on("OnFirmwareUptoDate", dataLogger);

EventEmitter.on("OnManualDataEntered", dataLogger);

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
EventEmitter.on("OnDebug", debugLogger);

EventEmitter.on("OnFileFromHost", fileLogger);
EventEmitter.on("OnFileFromDevice", fileLogger);

EventEmitter.on("OnRMSLogData", displayRMSLogger);
EventEmitter.on("OnRMSProgress", displayRMSProgressLogger);
EventEmitter.on("OnFirmwareLoadStatus", displayFirmwareLoadStatusLogger);
