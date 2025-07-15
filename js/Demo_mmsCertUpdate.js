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

import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";
import * as mt_UI from "./mt_ui.js";
import * as mt_CertMgr from "./MagTek_WebAPI/API_CertificateManager.js"
import "./MagTek_WebAPI/mt_events.js";

import DeviceFactory from "./MagTek_WebAPI/device/API_device_factory.js";
let mt_MMS = DeviceFactory.getDevice("MMS_HID");


let retval = "";
let _contactSeated = false;
let _AwaitingContactEMV = false;
export let _contactlessDelay = parseInt(mt_Utils.getEncodedValue("ContactlessDelay", "500"));
export let _openTimeDelay = 1500;
let CertExpirationWarningDays = 30;
let CertExpirationDays = 396;
//let CertExpirationDays = 20;
let fwID = null;

mt_CertMgr.setURL("https://rms.magensa.net/Qwantum/CertificateManager");
mt_CertMgr.setWebAPIKey("MTSandbox-F0FA3140-1E50-4331-8BB9-F33BF9CB32FB");
mt_CertMgr.setProfile("SandBox");


let ShowDeviceResponses = true;


document
  .querySelector("#getDeviceIP")
  .addEventListener("click", getDeviceIP);

document
  .querySelector("#getDeviceName")
  .addEventListener("click", getDeviceName);

document
  .querySelector("#getSSID")
  .addEventListener("click", getSSID);
document
  .querySelector("#setSSID")
  .addEventListener("click", setSSID);
document
  .querySelector("#getCSR")
  .addEventListener("click", getCSR);
document
  .querySelector("#getCertificate")
  .addEventListener("click", getCertificate);
document
  .querySelector("#setNoTLS")
  .addEventListener("click", setNoTLS);
document
  .querySelector("#setTLS")
  .addEventListener("click", setTLS);
document
  .querySelector("#setmTLS")
  .addEventListener("click", setmTLS);
document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);

document
  .querySelector("#clearCommand")
  .addEventListener("click", handleClearButton);

document.addEventListener("DOMContentLoaded", handleDOMLoaded);

document
  .querySelector("#ResetDevice")
  .addEventListener("click", ResetDevice);

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

async function setNoTLS(){
  ShowDeviceResponses = false;
  fwID = await mt_MMS.GetDeviceFWID();
  let resp = await mt_CertMgr.LoadCommands(fwID, "TrustNoTLS");
  if (!resp.status.ok){
    mt_UI.LogData("=============================");
    mt_UI.LogData(mt_UI.StringNoNulls(resp));
    mt_UI.LogData("=============================");
  }
  
  if (resp.status.ok){
    await parseCommands('Trust Configuration Update', resp.data.loadCommands);
  }
  await setWLANMode("02");
  ShowDeviceResponses = true;
}
async function setTLS(){
  ShowDeviceResponses = false;
  fwID = await mt_MMS.GetDeviceFWID();
  let resp = await mt_CertMgr.LoadCommands(fwID, "TrustTLS");
  if (!resp.status.ok){
    mt_UI.LogData("=============================");
    mt_UI.LogData(mt_UI.StringNoNulls(resp));
    mt_UI.LogData("=============================");
  }
  
  if (resp.status.ok){
    await parseCommands('Trust Configuration Update', resp.data.loadCommands);
  }
  await setWLANMode("02");
  ShowDeviceResponses = true;
}

async function setmTLS(){
  ShowDeviceResponses = false;
  fwID = await mt_MMS.GetDeviceFWID();
  let resp = await mt_CertMgr.LoadCommands(fwID, "TrustmTLS");
  if (!resp.status.ok){
    mt_UI.LogData("=============================");
    mt_UI.LogData(mt_UI.StringNoNulls(resp));
    mt_UI.LogData("=============================");
  }
  
  if (resp.status.ok){
    await parseCommands('Trust Configuration Update', resp.data.loadCommands);
  }
  await setWLANMode("02");
  ShowDeviceResponses = true;
}




async function getWLANMode(){  
  let mode = "";
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 870402020101 8902 D100");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode =="00")  
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);            
    let val = mt_Utils.getTagValue("D1","",Tag84.substring(26),false);
    switch (val) {
      case "00":
        mode = "MQTT"        
        break;
      case "02":
        mode = "WebSocket Server"        
        break;
    
      default:
        mode = "Unknown Mode"        
        break;
    }
    
    mt_UI.LogData(`WLAN Mode: ${mode}`);
  }


}
async function setWLANMode(hexMode) {  
  let mode = "";
  let val = "02";
    switch (hexMode) {
      case "00":
        mode = "MQTT"
        val = "00";        
        break;
      default:
        mode = "WebSocket Server";
        val = "02";
        break;
    }

  let Resp = await mt_MMS.sendCommand(`AA00 81040155D111 8410 D111 850101 870402020101 8903 D101 ${val}`);
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode =="00")  
  {
    mt_UI.LogData(`WLAN Mode: ${mode}`);
  }


}


async function getAddressMode(){

  let Resp = await mt_MMS.sendCommand("AA0081040116D101841AD10181072B06010401F609850101890AE208E206E104E102C500");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode =="00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C5","",Tag84.substring(48),false);
    let mode = "";
    switch (val) {
      case "00000000":
        mode = "Static IP";
        break;
      default:
        mode = "DHCP";
        break;
    }
    mt_UI.LogData(`Wireless Address Mode: ${mode}`);
  }
}
async function setAddressMode(){
  mt_UI.LogData("Setting Wireless Address Mode DHCP");
  let Resp = await mt_MMS.sendCommand("AA0081040117D111841ED11181072B06010401F609850101890EE20CE20AE108E106C50400000001");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C5","",Tag84.substring(48),false);    
  }
}

async function getWirelessSecurityMode(){

  let Resp = await mt_MMS.sendCommand("AA0081040113D101841AD10181072B06010401F609850101890AE208E206E104E102C300");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C3","",Tag84.substring(48),false);
    let mode = "";
    switch (val) {
      case "00":
        mode = "PSK";
        break;
      case "01":
        mode = "EAP-PEAP";
        break;
      default:
        mode = "Unknown Security Mode";
        break;
    }
    mt_UI.LogData(`Wireless Security Mode: ${mode}`);
  }
}
async function setWirelessSecurityMode(){
  mt_UI.LogData("Setting Wireless Security PSK Mode");
  let Resp = await mt_MMS.sendCommand("AA0081040114D111841BD11181072B06010401F609850101890BE209E207E105E103C30100");  
}



async function getDeviceIP(){
  ShowDeviceResponses = false;
  let Resp = await mt_MMS.sendCommand("AA008104010ED101841AD10181072B06010401F609850102890AE108E206E504E602C300");
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("deviceIP",mt_Utils.hexToDecIPv4(mt_Utils.getTagValue("C3","",Tag84.substring(48),false)));
  }
  ShowDeviceResponses = true;
}
async function getCSR() {
  let Resp = null;
  ShowDeviceResponses = false;
  mt_UI.updateProgressBar("",-1);  
  mt_UI.LogData("Generating CSR...");
  fwID = await mt_MMS.GetDeviceFWID();
  Resp = await mt_MMS.sendCommand("AA0081040155EF028402EF02");  
  Resp = await mt_MMS.sendCommand("AA0081040107EF038405EF03810100");
  Resp = await mt_MMS.sendCommand("AA0081040108D821840BD821810404000000870101");    
  ShowDeviceResponses = true;
}

async function getCertificate(){
  ShowDeviceResponses = false;
  let Resp = null;
  mt_UI.updateProgressBar("",-1);  
  fwID = await mt_MMS.GetDeviceFWID();
  mt_UI.LogData("Getting MagTek Root...");
  Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000000 870101");
  Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000100 870101");
  Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000200 870101");
  mt_UI.LogData("Getting Customer Certificate...");
  Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000300 870101");
  Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000400 870101");
  Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000500 870101");
  //mt_UI.LogData("Getting MagTek Trust config");
  //Resp = await mt_MMS.sendCommand("AA0081040107D821840BD8218104 03000900 870101");
  ShowDeviceResponses = true;
}

async function ResetDevice(){
  await setWLANMode("02");
  mt_UI.updateProgressBar("",-1);  
  mt_UI.LogData("Resetting Device...");
  ShowDeviceResponses = false;
  let Resp = await mt_MMS.sendCommand("AA00810401121F0184021F01"); 
  ShowDeviceResponses = true;
}

async function getSSID() {
  mt_UI.updateProgressBar("",-1);  
    ShowDeviceResponses = false;
  let Resp = await mt_MMS.sendCommand("AA0081040112D101841AD10181072B06010401F609850101890AE208E206E104E102C100");  
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("ssidName",mt_Utils.getTagValue("C1","",Tag84.substring(48),true));
    ShowDeviceResponses = true;
  }
}

async function setSSID() {
  mt_UI.updateProgressBar("",-1);  
  ShowDeviceResponses = false;
  let resp = "";
  let val = "";
  let name = mt_UI.GetValue("ssidName");
  if(name.length > 0)
  {
    val = mt_Utils.AsciiToHexPad(name, 0x20);
    mt_UI.LogData("Setting DHCP Mode");
    resp = await mt_MMS.sendCommand("AA0081040117D111841ED11181072B06010401F609850101890EE20CE20AE108E106C50400000001");
    mt_UI.LogData(`Setting SSID: ${name}`);
    resp = await mt_MMS.sendCommand(`AA0081040107D111843AD11181072B06010401F609850101892AE228E226E124E122C120${val}`); 
  }

  name = mt_UI.GetValue("ssidPwd");
  if(name.length > 0)
  {
    val = mt_Utils.AsciiToHexPad(name, 0x3F);
    mt_UI.LogData("Setting Wireless Password");
    resp = await mt_MMS.sendCommand(`AA0081040107D1118459D11181072B06010401F6098501018949E247E245E143E141C23F${val}`);  
  }
    ShowDeviceResponses = true;
}


async function getDeviceName() {
  mt_UI.updateProgressBar("",-1);  
  ShowDeviceResponses = false;
  let Resp = await mt_MMS.sendCommand("AA0081040125D101841AD10181072B06010401F609850101890AE208E206E104E102C800");  
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("deviceName",mt_Utils.getTagValue("C8","",Tag84.substring(48),true));
  }
  ShowDeviceResponses = true;
}


async function handleDOMLoaded() {
  let devices = await mt_MMS.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });

}

async function handleCloseButton() {
  mt_MMS.closeDevice();
  mt_UI.ClearLog();
}

async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  mt_UI.UpdateValue("deviceName","");
  mt_UI.UpdateValue("deviceIP","");
  mt_UI.UpdateValue("ssidName","");
  mt_UI.UpdateValue("ssidPwd","");
}

async function handleOpenButton() {
  window.mt_device_hid = await mt_MMS.openDevice();
}

function updateProgress(caption, progress ){
  EmitObject({ Name: "OnRMSProgress", Data: {Caption: caption, Progress: progress }});
};


async function parseCommands(description, messageArray) {
  mt_UI.updateProgressBar("",0);  
  for (let index = 0; index < messageArray.length; index++) 
  {
    let progress = parseInt((index / messageArray.length) * 100);
    updateProgress(`Loading ${description}`, progress);
    await parseCommand(messageArray[index]);
  }
  updateProgress(`Done Loading ${description}...`, 100);
};

async function parseCommand(message) {
  let Response;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":      
      break;
    case "GETDEVINFO":      
      break;
    case "SENDCOMMAND":
      Response = await mt_MMS.sendCommand(cmd[1]);      
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":
      window.mt_device_hid = await mt_MMS.openDevice();      
      break;
    case "CLOSEDEVICE":
      window.mt_device_hid = await mt_MMS.closeDevice();
      break;
    case "WAIT":
      wait(cmd[1]);
      break;
    case "DETECTDEVICE":
      window.mt_device_hid = await mt_MMS.openDevice();      
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);      
      mt_UI.LogData(retval);
      break;
    case "PARSETLV":
      retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "PARSEMMS":
      retval = mt_Utils.MMSParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    default:
      mt_Utils.debugLog(`Unknown Command: ${cmd[0]}`);
  }
};

const deviceConnectLogger = async (e) => {
  mt_UI.setUSBConnected("Connected");
    if (window.mt_device_WasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
};
const deviceOpenLogger = async (e) => {
  mt_UI.setUSBConnected("Opened");
  ShowDeviceResponses = false;
  await getWLANMode();
  await getAddressMode();
  await getDeviceIP();
  await getDeviceName()
  await getSSID();
  ShowDeviceResponses = true;
  
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const powerLogger = (e) => {
  switch (e.Data) {
    case "Reset":
      //mt_UI.LogData(`Resetting...`);    
      break;
    default:
      mt_UI.LogData(`${e.Name}: ${e.Data}`);
      break;
  }
};

const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
};

const trxCompleteLogger = (e) => {
  mt_UI.LogData(`${e.Name}: ${e.Data}`);
};
const displayMessageLogger = (e) => {
  mt_UI.LogData(`Display: ${e.Data}`);
  mt_UI.DeviceDisplay(e.Data);
};
const barcodeLogger = (e) => {
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
  if (ShowDeviceResponses) mt_UI.LogData(`Device Response: ${e.Data.HexString}`);
  
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
};
const touchDownLogger = (e) => {

};
const contactlessCardDetectedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Detected`);
};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = (e) => {
  _contactSeated = true;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);
};

const contactCardRemovedLogger = (e) => {
  _contactSeated = false;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Removed`);
};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected ${e.Data}`);  
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const fileLogger = async (e) => {
  
    let resp = null;

    
    let tagData = mt_Utils.getTagValue("84", "", e.Data.TLVData.substring(8), false);
    let tagFileName = mt_Utils.getTagValue("C1", "", tagData.substring(16), false);
    let tagFileContents = mt_Utils.getTagValue("CE", "", tagData.substring(16), false);

    switch (tagFileName) {
      case "03000000": case "03000100": case "03000200": case "03000300": case "03000400":case "03000500": case "03000900": 
        mt_UI.LogData(`Checking ${tagFileName} certificate expiration...`);
        resp = await mt_CertMgr.VerifyCertificate(fwID,tagFileContents);
        if (!resp.status.ok){
          mt_UI.LogData(mt_UI.StringNoNulls(resp));
        }
        else
        {
          if (resp.data.isValidNow && resp.data.expiresInDays > CertExpirationWarningDays)
          {
            mt_UI.LogData(`The certificate named ${resp.data.commonName} in slot ${tagFileName} is valid `);
            mt_UI.LogData("=============================");
            mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
            mt_UI.LogData("=============================");
          }
          else
          {
            if (!resp.data.isValidNow){
              mt_UI.LogData(`The certificate named ${resp.data.commonName} in slot ${tagFileName} is not valid`);
              mt_UI.LogData("=============================");
              mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
              mt_UI.LogData("=============================");
            }
            else
            {
              mt_UI.LogData(`The certificate named ${resp.data.commonName} in slot ${tagFileName} is valid. However, it expires in ${resp.data.expiresInDays} days`);
              mt_UI.LogData("=============================");
              mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
              mt_UI.LogData("=============================");
            }
          }
        }
       
      break;
      case '04000000':
        ShowDeviceResponses = false;
        //CertExpirationDays = parseInt(mt_UI.GetValue("certDays"));
        mt_UI.LogData(`Getting CSR signed for ${CertExpirationDays} days... `);
        
        
        resp = await mt_CertMgr.SignCSR(fwID, tagFileContents, CertExpirationDays, "Days");
        if (!resp.status.ok){
          mt_UI.LogData("=============================");
          mt_UI.LogData(mt_UI.StringNoNulls(resp));
          mt_UI.LogData("=============================");
        }
        
        if (resp.status.ok){
          //mt_UI.LogData("=============================");
          //mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
          //mt_UI.LogData("=============================");
          await parseCommands('Certificate Update', resp.data.certificateLoadCommands);
        }
        ShowDeviceResponses = true;
        break;
      default:
        mt_UI.LogData(`File: ${tagFileName} ${e.Data.HexString}`);
        break;
    }
  
};

const displayRMSProgressLogger = (e) => {  
  mt_UI.updateProgressBar(e.Data.Caption, e.Data.Progress)
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
EventEmitter.on("OnContactlessNFCUID", dataLogger);
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

EventEmitter.on("OnPowerEvent", powerLogger);

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
EventEmitter.on("OnRMSProgress", displayRMSProgressLogger);