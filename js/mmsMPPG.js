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
import * as mt_UI from "./mt_ui.js";
import * as mt_MPPG from "./mt_mppg_api.js";
import mqtt  from "./mqtt.esm.js";

import "./mt_events.js";

let url = mt_Utils.getDefaultValue('MQTTURL','wss://hd513d49.ala.us-east-1.emqxsl.com:8084/mqtt');
let devPath = mt_Utils.getDefaultValue('MQTTDevice','');
let userName = mt_Utils.getDefaultValue('MQTTUser','testDevice1');
let password = mt_Utils.getDefaultValue('MQTTPassword','t3stD3v1c1');
let client = null;


const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.devpath;
if (value != null) {
  devPath = value;
}




if (userName.length == 0 ) userName = null;
if (password.length == 0 ) password = null;

// Create an MQTT client instance
const options = {
  clean: true,
  connectTimeout: 4000,
  clientId: `MagTekClient-${mt_Utils.makeid(6)}`,
  username: userName,
  password: password  
};

let _contactSeated = false;
let _AwaitingContactEMV = false;

export let _contactlessDelay = parseInt(mt_Utils.getDefaultValue("ContactlessDelay", "500"));
export let _openTimeDelay = 1500;

 document
   .querySelector("#ProcessSale")
   .addEventListener("click", handleProcessSale);

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

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

async function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();

  mt_MPPG.setUsername(mt_Utils.getDefaultValue("MPPG_UserName", "TSYSPilotPROD"));
  mt_MPPG.setPassword(mt_Utils.getDefaultValue("MPPG_Password", "Password#12345"));
  mt_MPPG.setCustCode(mt_Utils.getDefaultValue("MPPG_CustCode", "KT44746264"));
  mt_MPPG.setProcessorName(mt_Utils.getDefaultValue("MPPG_ProcessorName", "TSYS - PILOT"));
  mt_UI.LogData(`Configured to use: ${mt_MPPG.ProcessorName}`);    


}

function SendCommand(cmdHexString) {
    client.publish(`MagTek/Device/${devPath}`, cmdHexString);
};

function OpenMQTT(){
  mt_UI.ClearLog();
  mt_UI.LogData(`Configured Device: ${devPath}`);
  
  if(client == null)
  {
    client = mqtt.connect(url, options);
    client.on('connect', ()=>{});
    client.on('connect', onMQTTConnect);
    
    client.on('message', ()=>{});
    client.on('message', onMQTTMessage);
  }
}

async function CloseMQTT(){
  if(client)
  {
    await client.end();
    client = null;      
  }
  EmitObject({Name:"OnDeviceClose", Device:client});
}

async function onMQTTConnect(connack) {  
  //console.log(`conack: ${JSON.stringify(connack)}`);
  if(client != null){
  // Subscribe to a topic
  await client.unsubscribe(`MagTek/Server/${devPath}/MMSMessage`, CheckMQTTError);
  await client.unsubscribe(`MagTek/Server/+/+/Status`, CheckMQTTError);
  
  await client.subscribe(`MagTek/Server/${devPath}/MMSMessage`, CheckMQTTError);
  await client.subscribe(`MagTek/Server/+/+/Status`, CheckMQTTError);
}
};

function CheckMQTTError (err) {
  if (err) 
  {
    EmitObject({Name:"OnError",
      Source: "MQTTError",
      Data: err
    });
  }
};

function onMQTTMessage(topic, message) {
    let data = message.toString();
    let topicArray = topic.split('/');
    if(topicArray.length == 5){
      switch (topicArray[4]) {
        case "Status":
        mt_UI.AddDeviceLink(topicArray[2], `${topicArray[3]}`,message, `${window.location.pathname}?devpath=${topicArray[2]}/${topicArray[3]}`);
          if( `${topicArray[2]}/${topicArray[3]}` == devPath){
          if( data.toLowerCase() == "connected")
          {
            if(client)
              {              
              EmitObject({Name:"OnDeviceOpen", Device:client}); 
              }
            else
              {
              EmitObject({Name:"OnDeviceConnect", Device:null});
              }              
          }
          else
          {
            EmitObject({Name:"OnDeviceDisconnect", Device:null});
          }
          }
          break; 
        case "MMSMessage":
          mt_MMS.ParseMMSMessage(mt_Utils.hexToBytes(data));
          break;
        case "V5Message":
          //mt_MMS.ParseMMSMessage(mt_Utils.hexToBytes(data));
          break;
        default:
          console.log(`${topic}: ${data}`);
          break;
      }
    }
};

async function handleCloseButton() {
  await CloseMQTT();
  mt_UI.ClearLog();
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  window.ARQCData = null;
  SetAutoCheck();
}

 async function handleProcessSale() {
   if (window.ARQCData != null) {
     
    let amt = document.getElementById("saleAmount").value;
    if (amt.length > 0)
    {
      if(confirm("Ready To Process Sale?"))
        {
          let Amount = {
            SubTotal: 0,
            Tax: 0,
            Tip: 0,
            CashBack:0
          }
    
          
          let tax = document.getElementById("saleTax").value;
          let tip = document.getElementById("saleTip").value;      
          
          if(amt.length > 0) Amount.SubTotal = parseFloat(amt);
          if(tax.length > 0) Amount.Tax = parseFloat(tax);
          if(tip.length > 0) Amount.Tip = parseFloat(tip);
    
          let email = document.getElementById("receiptEmail").value;
          let sms = document.getElementById("receiptSMS").value;
          var saleResp = await mt_MPPG.ProcessSale(Amount, email, sms);
          mt_UI.LogData(`Sale Response`);
          mt_UI.LogData(JSON.stringify(saleResp.Details, null, 2));
        }
    }
    else
    {
      mt_UI.LogData(`No Amount Entered`);
    }
   } 
   else 
   {
     mt_UI.LogData(`No ARQC Available`);
     if(confirm("Start Sale Transaction?"))
     {
      SendCommand("AA008104010010018430100182010AA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840");
     }
   }
 }

async function handleOpenButton() {
  OpenMQTT();
  SetAutoCheck();
  SetTechnologies(true, true, true);
}

async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}

async function parseCommand(message) {
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      SendCommand(cmd[1]);
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":      
      OpenWS(wsAddress);     
      break;
    case "CLOSEDEVICE":      
      CloseWS();
      break;
    case "WAIT":
      wait(cmd[1]);
      break;
    case "DETECTDEVICE":
      //window._device = await mt_MMS.openDevice();      
      break;
    case "GETTAGVALUE":
      var retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], Boolean(cmd[4]));
      mt_UI.LogData(retval);
      break;
    case "PARSETLV":
      var retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    case "PROCESS_SALE": 
      handleProcessSale();
      break;
    default:
      mt_Utils.debugLog("Unknown Command");
  }
};

function ClearAutoCheck() {
  var chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

function SetAutoCheck() {
  var chk = document.getElementById("chk-AutoStart");
  chk.checked = true;
}

function SetTechnologies(bEMV, bNFC, bMSR) {
  
  document.getElementById("chk-AutoEMV").checked = bEMV;
  document.getElementById("chk-AutoNFC").checked = bNFC;
  document.getElementById("chk-AutoMSR").checked = bMSR;
  
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

const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
};

const trxCompleteLogger = (e) => {
  mt_UI.LogData(`${e.Name}: ${e.Data}`);
};
const displayMessageLogger = (e) => {
  //mt_UI.LogData(`Display: ${e.Data}`);
  mt_UI.DeviceDisplay(e.Data);
};
const barcodeLogger = (e) => {
  mt_UI.LogData(`Barcode  Data: ${e.Data}`);
};
const arqcLogger = (e) => {
  mt_UI.LogData(`${e.Source} ARQC Data:  ${e.Data}`);
  window.ARQCData = e.Data;
  window.ARQCType = e.Source;
  handleProcessSale();
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};
const fromDeviceLogger = (e) => {
  mt_UI.LogData(`Device Response: ${e.Data.TLVData}`);
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
      // We didn't get a contact seated, do start the contactless transaction
      SendCommand("AA008104010010018430100182010AA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840");
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
    SendCommand("AA008104010010018430100182010AA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
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
    SendCommand("AA008104010010018430100182010AA30981010182010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
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