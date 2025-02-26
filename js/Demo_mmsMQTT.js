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
import * as mt_RMS_API from "./MagTek_WebAPI/API_rms.js";
import * as mt_MMSMQTT_API from "./MagTek_WebAPI/API_mmsMQTT.js";
import * as mt_MMS_Commands from "./MagTek_WebAPI/API_mmsCommands.js"

let retval = "";
let defaultRMSURL = '';
let defaultRMSAPIKey = '';
let defaultRMSProfileName = '';
let ShowDeviceResponses = true;
let _DeviceDetected = false;

let url = mt_Utils.getEncodedValue('MQTTURL','d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==');
let devPath = mt_Utils.getEncodedValue('MQTTDevice','');
let userName = mt_Utils.getEncodedValue('MQTTUser','RGVtb0NsaWVudA==');
//if (userName.length == 0 ) userName = null;

let password = mt_Utils.getEncodedValue('MQTTPassword','ZDNtMENMdjFjMQ==');
//if (password.length == 0 ) password = null;


const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.devpath;
if (value != null) {
  devPath = value;
}


let _contactSeated = false;
let _AwaitingContactEMV = false;

export let _contactlessDelay = parseInt(mt_Utils.getEncodedValue("ContactlessDelay", "NTAw"));
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

document.getElementById('fileInput')
  .addEventListener('change', handleFileUpload);
  
document.addEventListener("DOMContentLoaded", handleDOMLoaded);

async function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();
}

async function handleCloseButton() {
  await mt_MMSMQTT_API.CloseMQTT();
  mt_UI.ClearLog();
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  window.mt_device_ARQCData = null;
  document.getElementById("fileInput").value = null;
}


async function handleOpenButton() {
  mt_MMSMQTT_API.setURL(url);
  mt_MMSMQTT_API.setUserName(userName);
  mt_MMSMQTT_API.setPassword(password);
  mt_MMSMQTT_API.setPath(devPath);  
  mt_MMSMQTT_API.OpenMQTT();
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
      await mt_MMSMQTT_API.SendCommand(cmd[1]);
      break;
    case "SENDBASE64COMMAND":
      await mt_MMSMQTT_API.sendBase64Command(cmd[1]);
      break;
    case "PCIRESET":
      mt_MMSMQTT_API.SendCommand("AA00810401121F0184021F01");      
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":      
      mt_MMSMQTT_API.OpenMQTT();
      break;
    case "CLOSEDEVICE":      
    mt_MMSMQTT_API.CloseMQTT();
      break;
    case "WAIT":
      _DeviceDetected = false;
      let numSecs = parseInt((cmd[1] /1000), 10);
      let numQseconds = parseInt((numSecs * 4), 10)
      let index = 0
      while (index < numQseconds && !_DeviceDetected) {
        let progress = parseInt((index / numQseconds) * 100);
        await mt_Utils.wait(250);
        mt_UI.updateProgressBar(`Waiting up to ${numSecs} seconds...`, progress)  
        index++
      }
      if(_DeviceDetected){
        mt_UI.updateProgressBar(``, 100)
        await mt_Utils.wait(1000);
      }
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
    case "GETDEVICESN":
      let sn = await mt_MMSMQTT_API.GetDeviceSN();
      mt_UI.LogData(sn);
      break;
    case "GETFIRMWAREID":
      let fw = await mt_MMSMQTT_API.GetDeviceFWID();
      mt_UI.LogData(fw);
      break;
    case "UPDATEFIRMWARERMS":
      updateFirmwareRMS(); 
      break;
    case "UPDATETAGSRMS":
      updateTagsRMS(); 
      break;
    case "HEXTOBASE64":
      let b64Data = mt_Utils.hexToBase64(cmd[1])
      mt_UI.LogData(b64Data);
      break;
    case "BASE64TOHEX":
      hexData = mt_Utils.base64ToHex(cmd[1])
      mt_UI.LogData(hexData);
      break;
    case "UPDATEFIRMARE":  case "UPDATEFIRMWARE":
      let fwResponse =  await mt_MMS_Commands.GetLoadFimrwareFromBase64(cmd[1],cmd[2]);
      window.mt_device_CommitCmd = fwResponse.commitCmd;
      await mt_MMSMQTT_API.SendCommand(fwResponse.firmwareCmd);
      break;    
    default:
      mt_UI.LogData("Unknown Command");
      break;
  }
};

function ClearAutoCheck() {
  let chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

const deviceConnectLogger = (e) => {
  mt_UI.setUSBConnected("Connected");
  _DeviceDetected = false;
};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
  _DeviceDetected = false;
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
  _DeviceDetected = false;
};
const deviceOpenLogger = (e) => {
  mt_UI.setUSBConnected("Opened");
  _DeviceDetected = true;
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const NFCUIDLogger = (e) => {
  mt_UI.LogData(`Received NFC UID : ${e.Name}: ${e.Data}`);
  mt_MMSMQTT_API.SendCommand("AA00810401641100840B1100810160820100830100");
  mt_MMSMQTT_API.SendCommand("AA00810401671100840D110081033A04278201008301FF");
};


const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);

  let TLVs = mt_Utils.tlvParser(e.Data.TLV.substring(24));
  mt_UI.PrintTLVs(TLVs)
};

const trxCompleteLogger = (e) => {
  mt_UI.LogData(`${e.Name}: ${e.Data}`);
};
const displayMessageLogger = (e) => {
  mt_UI.LogData(`Display: ${e.Data}`);
  mt_UI.DeviceDisplay(e.Data);
};
const barcodeLogger = (e) => {
  let bcData = "";
  bcData = mt_Utils.getTagValue("DF74", "", e.Data, true);
  mt_UI.LogData(`Barcode  Data: ${bcData}`);
  if (bcData.toLowerCase().startsWith('http'))
  {
    mt_UI.LogData(`Opening: ${bcData}` );
    window.open(bcData, '_blank');
  }

};
const arqcLogger = (e) => {
  mt_UI.LogData(`${e.Source} ARQC Data:  ${e.Data}`);
  window.mt_device_ARQCData = e.Data;
  window.mt_device_ARQCType = e.Source;
  let TLVs = mt_Utils.tlvParser(e.Data.substring(4));
   mt_UI.PrintTLVs(TLVs);
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};

const fromDeviceLogger = (e) => {
  if (ShowDeviceResponses) mt_UI.LogData(`Device Response: ${e.Data.HexString}`);

  //this is to demo opening web pages from a URI that was read via NFC 
    let retData = mt_Utils.getTagValue("DF7A", "", e.Data.TLVData.substring(38), false)
    if(retData.length > 0 )
    {
        let StartPos = retData.indexOf("5504");
        if(StartPos > 0 )
        {
            let len = parseInt(retData.substring(StartPos-2,StartPos),16)*2 - 2;
            let uri = mt_Utils.hexToASCII(retData.substring(StartPos+4, StartPos+4 + len));
            mt_UI.LogData(`Opening: ${uri}` );
            window.open(`https://${uri}`, '_blank');
        }
    }
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
    if (chkEMV.checked) {
      _AwaitingContactEMV = true;
      mt_UI.LogData(`Delaying Contactless ${_contactlessDelay}ms`);
      await mt_Utils.wait(_contactlessDelay);
    }
    if (!_contactSeated) {
      // We didn't get a contact seated, do start the contactless transaction
      mt_MMSMQTT_API.SendCommand("AA00810401031001843D1001820178A3098101008201008301038402020386279C01009F02060000000001009F03060000000000005F2A0208405F3601029F150200009F530100");
    }
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
    mt_MMSMQTT_API.SendCommand("AA008104010010018430100182010AA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
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
    mt_MMSMQTT_API.SendCommand("AA008104010010018430100182010AA30981010182010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const fileLogger = (e) => {
  //mt_UI.LogData(`File: ${e.Data.HexString}`);
};


const mqttStatus = e => {
  let topicArray = e.Data.Topic.split('/');
  let data = e.Data.Message;
  mt_UI.AddDeviceLink(topicArray[topicArray.length-3], `${topicArray[topicArray.length-2]}`,data, `${window.location.pathname}?devpath=${topicArray[topicArray.length-3]}/${topicArray[topicArray.length-2]}`);
}


const firmwareUpdateLogger = (e) =>{
switch (e.Data) {
    case "820408010903":
      if (window.mt_device_CommitCmd != undefined)
        {
          mt_UI.LogData("Committing Firmware...");
          mt_MMSMQTT_API.SendCommand(window.mt_device_CommitCmd);  
        }
      break;
    case "820408010A03":
      mt_UI.LogData("Firmware Update Succeeded");
      mt_UI.LogData("Device Rebooting...");
      break;
    case "820408010904":
        mt_UI.LogData("Firmware Commit Failed");
        break;
    case "820408010A04":
        mt_UI.LogData("Firmware Load Failed");
        break;
    default:
      mt_UI.LogData(`Unknown Firmware Status: ${e.Data}`);
      break;
  }
}


async function handleFileUpload(event) {
  if( event.target.files.length == 1 )
  {
    const file = event.target.files[0];
    const ext = mt_Utils.getFileExtension(file.name);
    switch (ext.toLowerCase()) {
       case "txt": case "script":
        await parseScriptFile(file);
        break;
      case "fw-boot":
        await parseFirmwareFile(file, 0)  
        break;
      case "fw-main":
        await parseFirmwareFile(file, 1)
        break;
      default:
        mt_UI.LogData("Unknown File Type")
        break;
    }
};
}

async function parseScriptFile(file){
  const reader = new FileReader();
      reader.onload = async function(e) {
      const lines = e.target.result.split('\n');
      for (const line of lines) 
        {
        await parseCommand(line);        
        }
    };
  reader.readAsText(file);   
}

async function parseFirmwareFile(file, fileType = 1){
  const reader = new FileReader();
    reader.onload = async function(e) {
      const firmwareBuffer = new Uint8Array(reader.result);
      let response =  await mt_MMS_Commands.GetLoadFimrwarefromByteArray(fileType, firmwareBuffer);
        mt_UI.LogData(`commit ${response.commitCmd}`);
        mt_UI.LogData(`fw ${response.firmwareCmd}`);
      window.mt_device_CommitCmd = response.commitCmd;
      mt_MMSMQTT_API.SendCommand(response.firmwareCmd);
    };
  reader.readAsArrayBuffer(file); 
}

async function updateFirmwareRMS(){
  let startTime = Date.now();
  mt_RMS_API.setURL(mt_Utils.getEncodedValue('RMSBaseURL',defaultRMSURL));
  mt_RMS_API.setAPIKey(mt_Utils.getEncodedValue('RMSAPIKey',defaultRMSAPIKey));
  mt_RMS_API.setProfileName(mt_Utils.getEncodedValue('RMSProfileName',defaultRMSProfileName));
  
  ShowDeviceResponses = false;
  let fw = await mt_MMSMQTT_API.GetDeviceFWID();
  let sn = await mt_MMSMQTT_API.GetDeviceSN();
  ShowDeviceResponses = true;

  if(mt_RMS_API.BaseURL.length > 0 && mt_RMS_API.APIKey.length > 0 && mt_RMS_API.ProfileName.length > 0){        
    await updateFirmwareRMSWebAPI(fw,sn);
    let endTime = Date.now();
    let executionTimeMs = endTime - startTime;
    let executionTimeSec = executionTimeMs / 1000;
    mt_UI.LogData(`Execution time: ${executionTimeSec} seconds`);
    ShowDeviceResponses = false;
    await mt_MMSMQTT_API.SendCommand('AA0081040155180384081803810100820114');
    ShowDeviceResponses = true;    
  }
  else
  {
    mt_UI.LogData(`Please set APIKey and ProfileName`);
  }
}

async function updateTagsRMS(){
  let startTime = Date.now();
  mt_RMS_API.setURL(mt_Utils.getEncodedValue('RMSBaseURL',defaultRMSURL));
  mt_RMS_API.setAPIKey(mt_Utils.getEncodedValue('RMSAPIKey',defaultRMSAPIKey));
  mt_RMS_API.setProfileName(mt_Utils.getEncodedValue('RMSProfileName',defaultRMSProfileName));
  
  ShowDeviceResponses = false;
  let fw = await mt_MMSMQTT_API.GetDeviceFWID();
  let sn = await mt_MMSMQTT_API.GetDeviceSN();
  ShowDeviceResponses = true;

  

  if(mt_RMS_API.BaseURL.length > 0 && mt_RMS_API.APIKey.length > 0 && mt_RMS_API.ProfileName.length > 0){        
    await updateAllTagsRMS(fw,sn);
    let endTime = Date.now();
    let executionTimeMs = endTime - startTime;
    let executionTimeSec = executionTimeMs / 1000;
    mt_UI.LogData(`Execution time: ${executionTimeSec} seconds`);
  }
  else
  {
    mt_UI.LogData(`Please set APIKey and ProfileName`);
  }
}


async function updateFirmwareRMSWebAPI(fwID, deviceSN, interfaceType = 'USB', downloadPayload = true) {
  try {
    
    mt_UI.LogData(`Checking Firmware...`);

    
    let strVersion = mt_Utils.getEncodedValue("RMSVersion","");    

    if(strVersion == '0'  &&  fwID.substring(0,10) == '1000009712'){
      fwID = '1000009712-AB1-PRD';
      mt_UI.LogData(`Forcing Firmware Update`);
    } 
    
    ShowDeviceResponses = false;
        //Sending Please Wait
        let cmds = await mt_Utils.FetchCommandsfromURL("cmds/DisplayLoadingFirmware.txt");
        if (cmds.status.ok){
          await parseCommands('Firmware Update', cmds.data);
        }
    
    ShowDeviceResponses = true;

    let req = {
      ProfileName: mt_RMS_API.ProfileName,      
      FirmwareID: fwID,
      InterfaceType: interfaceType,
      DownloadPayload: downloadPayload,
      DeviceSerialNumber: deviceSN
    };

    let firmwareResp = await mt_RMS_API.GetFirmware(req);
           if(firmwareResp.data.HasBLEFirmware){
           } 
           if(firmwareResp.data.DeviceConfigs != null){
           } 

    switch (firmwareResp.data.ResultCode) {
      case 0:
        mt_UI.LogData(`The ${firmwareResp.data.Description} has an update available!`);
        if (firmwareResp.data.Commands.length > 0) {
          if(firmwareResp.data.ReleaseNotes.length > 0 ) mt_UI.LogData(firmwareResp.data.ReleaseNotes);
            if(firmwareResp.data.HasBLEFirmware){
            //_HasBLEFirmware = true;
            mt_UI.LogData("This reader has BLE firmware");
          } 
          if(firmwareResp.data.DeviceConfigs != null){
            //_DeviceConfigList = firmwareResp.data.DeviceConfigs;
            mt_UI.LogData("This reader has device configs");
          } 
          await parseCommands(firmwareResp.data.Description, firmwareResp.data.Commands);
        }
        break;
      case 1:
        mt_UI.LogData(`The ${firmwareResp.data.Description} is up to date.`);
        break;
      case 2:
        mt_UI.LogData(`The ${firmwareResp.data.Description} is up to date.`);
        break;
      default:
        mt_UI.LogData(`${firmwareResp.data.Result}`);
        break;
    }
    return true;
  } catch (error) {
    return error;
  }
};


async function updateAllTagsRMS(fw,sn) {
  mt_UI.LogData(`Checking Tags and CAPKs...`);
  let bStatus = false;
  let resp = "";
   let updateCommands = [
   "AA0081040108D8218408D825810400000000",
   "AA0081040108D8218408D825810400000100",
   "AA0081040108D8218408D825810400000200",
   "AA0081040108D8218408D825810400000300",
   "AA0081040108D8218408D825810400000400",
   "AA0081040108D8218408D825810400000500",
   "AA0081040108D8218408D825810400000600",
   "AA0081040108D8218408D825810400000700",
   "AA0081040108D8218408D825810400000800",
   "AA0081040108D8218408D825810400000900"
   ];

   for (let index = 0; index < updateCommands.length; index++) {
    ShowDeviceResponses = false;
    resp = await mt_MMSMQTT_API.SendCommand(updateCommands[index]);
    ShowDeviceResponses = true;
    bStatus = await updateMMSTags(fw, sn, resp);
  }
  mt_UI.LogData(`Done Loading Tags and CAPKs...`);
  return bStatus;
};



async function updateMMSTags(fw, sn, response, downloadPayload = true, rawCommands = true)  {
  try {
    let tagsResp = null;
      let ver = null;
      let strVersion = mt_Utils.getEncodedValue("RMSVersion","");
      strVersion.length > 0 ? ver = parseInt(strVersion) : ver = null;
    if (response.HexString.length > 16) {
      
      let req = {
        ProfileName: mt_RMS_API.ProfileName,
        Version: ver,
        TerminalConfiguration: response.HexString,
        BillingLabel: mt_Utils.getEncodedValue("RMSBillingLabel","V0VCIERlbW8gVGVzdA=="),
        InterfaceType: mt_Utils.getEncodedValue("RMSInterface","VVNC"),
        DownloadPayload: downloadPayload,
        FirmwareID: fw,
        DeviceSerialNumber: sn,
        RawCommands : rawCommands
    };
      tagsResp = await mt_RMS_API.GetTags(req);      
    }

    switch (tagsResp.data.ResultCode) {
      case -2:        
        break;
      case 0:
        mt_UI.LogData(`The ${tagsResp.data.Description} has an update available!`);
        if (tagsResp.data.Commands.length > 0) {
          await parseCommands(tagsResp.data.Description, tagsResp.data.Commands);
        }
        break;
      case 1:
        mt_UI.LogData(`The ${tagsResp.data.Description} is up to date.`);
        break;
      case 2:
        mt_UI.LogData(`The ${tagsResp.data.Description} is up to date.`);
        break;
      default:
        mt_UI.LogData(`${tagsResp.data.Result} ${tagsResp.data.ResultCode}`);
        break;
    }
    return true;
  } catch (error)
  {
    return error;
  }
};


async function parseCommands(description, messageArray) {
  for (let index = 0; index < messageArray.length; index++) 
  {
    let progress = parseInt((index / messageArray.length) * 100);
    mt_UI.updateProgressBar(`Loading ${description}`, progress);
    await parseCommand(messageArray[index]);
  }
  mt_UI.updateProgressBar(`Done Loading ${description}...`, 100);
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

EventEmitter.on("OnFirmwareUpdateFailed", firmwareUpdateLogger);
EventEmitter.on("OnFirmwareUpdateSuccessful", firmwareUpdateLogger);
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
EventEmitter.on("OnMQTTStatus", mqttStatus);
EventEmitter.on("OnV5Event", dataLogger);
EventEmitter.on("OnV5DeviceResponse", dataLogger);
EventEmitter.on("OnUserSelection", dataLogger);