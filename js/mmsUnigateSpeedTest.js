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
import * as mt_Unigate from "./MagTek_WebAPI/API_Unigate.js";
import * as mt_QMFA from "./MagTek_WebAPI/qMFAAPI.js";
import "./MagTek_WebAPI/mt_events.js";
import DeviceFactory from "./MagTek_WebAPI/device/API_device_factory.js";
let mt_Device = DeviceFactory.getDevice("MMS_HID");

let startTime = Date.now(); 
let endTime = Date.now();
let executionTimeMs = endTime - startTime;


let device_isOpen = false;

let retval = "";
// let url = mt_Utils.getEncodedValue('MQTTURL','d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==');
// let devPath = mt_Utils.getEncodedValue('MQTTDevice','');
// let userName = mt_Utils.getEncodedValue('MQTTUser','RGVtb0NsaWVudA==');
// let password = mt_Utils.getEncodedValue('MQTTPassword','ZDNtMENMdjFjMQ==');
// let client = null;


const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.devpath;
if (value != null) {
  devPath = value;
}




// if (userName.length == 0 ) userName = null;
// if (password.length == 0 ) password = null;

let _contactSeated = false;
let _AwaitingContactEMV = false;

//export let _contactlessDelay = parseInt(mt_Utils.getEncodedValue("ContactlessDelay", "NTAw"));
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
  .querySelector("#clearCommand")
  .addEventListener("click", handleClearButton);
document
  .querySelector("#saleAmount")
  .addEventListener("change", SetAutoCheck);
  
document.addEventListener("DOMContentLoaded", handleDOMLoaded);

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

async function handleDOMLoaded() {
  //mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();

  mt_Unigate.setUsername(mt_Utils.getEncodedValue("MPPG_UserName", "VFNZU1BpbG90UFJPRA=="));
  mt_Unigate.setPassword(mt_Utils.getEncodedValue("MPPG_Password", "UGFzc3dvcmQjMTIzNDU="));
  mt_Unigate.setCustCode(mt_Utils.getEncodedValue("MPPG_CustCode", "S1Q0NDc0NjI2NA=="));
  mt_Unigate.setProcessorName(mt_Utils.getEncodedValue("MPPG_ProcessorName", "VFNZUyAtIFBJTE9U"));
  mt_UI.LogData(`Configured to use: ${mt_Unigate.ProcessorName}`);
};

async function handleCloseButton() {
  await mt_Device.closeDevice();
  mt_UI.ClearLog();
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  window.mt_device_ARQCData = null;  

  SetAutoCheck();
  //send welcome;
  if (device_isOpen) mt_Device.sendCommand("AA0081040155180384081803810100820114");
}

 async function handleProcessSale() {
  let QMFAChecked = document.getElementById("chk-UseQMFA").checked;
  if (window.mt_device_ARQCData != null) {
    let amt = document.getElementById("saleAmount").value;
    if (amt.length > 0)
    {
      //if(confirm("Ready To Process Sale?"))
      if(true)
        {
          let Amount = {
            SubTotal: 0,
            Tax: 0,
            Tip: 0,
            CashBack: 0
          }
    
          
          let tax = document.getElementById("saleTax").value;
          let tip = document.getElementById("saleTip").value;      
          
          if(amt.length > 0) Amount.SubTotal = parseFloat(amt);
          if(tax.length > 0) Amount.Tax = parseFloat(tax);
          if(tip.length > 0) Amount.Tip = parseFloat(tip);
    
          let email = document.getElementById("receiptEmail").value;
          let sms = document.getElementById("receiptSMS").value;
   
            mt_Unigate.setUsername(mt_Utils.getEncodedValue("MPPG_UserName", "VFNZU1BpbG90UFJPRA=="));
            mt_Unigate.setPassword(mt_Utils.getEncodedValue("MPPG_Password", "UGFzc3dvcmQjMTIzNDU="));
            mt_Unigate.setCustCode(mt_Utils.getEncodedValue("MPPG_CustCode", "S1Q0NDc0NjI2NA=="));
            mt_Unigate.setProcessorName(mt_Utils.getEncodedValue("MPPG_ProcessorName", "VFNZUyAtIFBJTE9U"));
            let saleResp = await mt_Unigate.ProcessARQCTransaction(Amount, window.mt_device_ARQCData, undefined, "SALE", "Credit", true);  

            if(saleResp.status.code == 200)
              {
                let claims = saleResp.data.Details;
                claims.magTranID = saleResp.data.magTranID;
                window.mt_device_SaleResponse = saleResp.data;
              }
                       
              if (!QMFAChecked && saleResp.status.code == 200)
              {
                if(Object.keys(saleResp.data.Details).length  > 0 )
                  {
                    mt_UI.LogData(`=====================Processor Response KVPs=====================`);
                    for (var key in saleResp.data.Details) {
                        mt_UI.LogData(`${key}: ${saleResp.data.Details[key]}` );
                    }
                    mt_UI.LogData(`======================Processor Response KVPs======================`);
                  }

              }
              window.mt_device_ARQCData = null;        
              await mt_Device.sendCommand("AA0081040155180384081803810100820103");
              endTime = Date.now();
              executionTimeMs = endTime - startTime;
              mt_UI.LogData("=======================================================");
              mt_UI.LogData(`Total Transaction Time: ${executionTimeMs} milliseconds`);
              mt_UI.LogData("=======================================================");
        }
    }
    else
    {
      mt_UI.LogData(`No Amount Entered`);
    }
   } 
   else 
   {
     mt_UI.LogData(`Starting Transaction`);
     mt_Device.sendCommand("AA008104010010018430100182010AA30981010182010183010184020003861A9C01009F02060000000001009F03060000000000005F2A020840");
   }
 }

async function handleOpenButton() {
  
  //mt_Device.setURL(url);
  //mt_Device.setUserName(userName);
  //mt_Device.setPassword(password);
  //mt_Device.setPath(devPath);  
  //mt_Device.setDeviceList(mt_Utils.getEncodedValue("MQTTDeviceList", "TWFnVGVrL1VTLysvKy8rLysvKy9TdGF0dXM="));
  mt_Device.openDevice();
  //SetAutoCheck();
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
      //mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      //mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      mt_Device.sendCommand(cmd[1]);
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":      
      mt_Device.openDevice();      
      break;
    case "CLOSEDEVICE":      
      mt_Device.closeDevice();
      break;
    case "WAIT":
      await mt_Utils.wait(cmd[1]);
      break;
    case "DETECTDEVICE":
      //window._device = await mt_MMS.openDevice();      
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
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    case "PROCESS_SALE": 
      handleProcessSale();
      break;
    default:
      //mt_Utils.debugLog("Unknown Command");
  }
};

function ClearAutoCheck() {
  let chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

function SetAutoCheck() {
  let chk = document.getElementById("chk-AutoStart");
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
  device_isOpen = false;
  mt_UI.setUSBConnected("Closed");  
};
const deviceOpenLogger = async (e) => {
  device_isOpen = true;
  mt_UI.setUSBConnected("Opened");  
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
};

const trxCompleteLogger = (e) => {
  endTime = Date.now();
  executionTimeMs = endTime - startTime;
  mt_UI.LogData("=======================================================");
  mt_UI.LogData(`Contactless Transaction Time: ${executionTimeMs} milliseconds`);  
};
const displayMessageLogger = (e) => {
  mt_UI.DeviceDisplay(e.Data);
};
const barcodeLogger = async (e) => {
  let stringbc = mt_Utils.getTagValue("DF74", "", e.Data, true);
  let bc = JSON.parse(stringbc);
  if(bc.Header == "QMFAToken")
  {
    mt_UI.LogData("Redeeming Token");
    let resp = await mt_QMFA.TransactionRedeem(bc.ID,bc.Status.toString(), bc.Reason);    
    if(resp.status == 0 )
    {
    if(window.mt_device_SaleResponse != null)
      {
        if (bc.Status == true)
        {
          let Outdata = window.mt_device_SaleResponse.Details.customerReceipt.replace(/\\n/g, '\n');
          mt_UI.LogData(`Receipt:`);
          mt_UI.LogData(`${Outdata}`);
          
          mt_UI.LogData(`The transaction was authorized and it's transaction details were authenticated and verified by the customer.`);  
        }
        else
        {
          mt_UI.LogData(`The transaction was cancelled because the customer did not verify the authenticity of the transaction details.`);
        }
      }
    }
  else
  {
      mt_UI.LogData(`Error: ${JSON.stringify(resp, null, 2)}`);
  }

  }
  else
  {
    mt_UI.LogData(`Barcode  Data: ${stringbc}`);
  }
};
const arqcLogger = (e) => {
  window.mt_device_ARQCData = e.Data;
  window.mt_device_ARQCType = e.Source;  
  endTime = Date.now();
  executionTimeMs = endTime - startTime;
  mt_UI.LogData("=======================================================");
  mt_UI.LogData(`Time to get ARQC: ${executionTimeMs} milliseconds`);  
  handleProcessSale();
};
const batchLogger = (e) => {
};
const fromDeviceLogger = (e) => {
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
const contactlessCardDetectedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Detected`);
  let chk = document.getElementById("chk-AutoNFC");
  let chkEMV = document.getElementById("chk-AutoEMV");  
  let _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting...`);
    startTime = Date.now(); 
    mt_Device.sendCommand("AA008104010010018430100182010AA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840");    
  }
};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = (e) => {
  _contactSeated = true;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);
  let chk = document.getElementById("chk-AutoEMV");
  let _autoStart = document.getElementById("chk-AutoStart");
  if (
    _autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle") ||
    _AwaitingContactEMV
  ) {
    _AwaitingContactEMV = false;
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting EMV...`);
    mt_Device.sendCommand("AA008104010010018430100182010AA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }
};

const contactCardRemovedLogger = (e) => {
  _contactSeated = false;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Removed`);
};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected ${e.Data}`);
  let chk = document.getElementById("chk-AutoMSR");
  let _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting MSR...`);
    mt_Device.sendCommand("AA008104010010018430100182010AA30981010182010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const mqttStatus = e => {
  let topicArray = e.Data.Topic.split('/');
  let deviceStatus = e.Data.Message;
  let deviceType = topicArray[topicArray.length-3];
  let deviceName = topicArray[topicArray.length-2];
  let deviceURL = `${window.location.pathname}?devpath=${mt_Utils.removeLastPathSegment(e.Data.Topic)}`;
  mt_UI.AddDeviceLink(deviceType, deviceName ,deviceStatus, deviceURL);
}


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
EventEmitter.on("OnMQTTStatus", mqttStatus);