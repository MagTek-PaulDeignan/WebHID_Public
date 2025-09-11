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
import "./MagTek_WebAPI/mt_events.js";
import * as mt_XML2JSON from "./MagTek_WebAPI/mt_xml2json.js";
import * as mt_MMS_Commands from "./MagTek_WebAPI/API_mmsCommands.js"

import DeviceFactory from "./MagTek_WebAPI/device/API_device_factory.js";
let mt_MMS = DeviceFactory.getDevice("MMS_HID");


let defaultRMSURL = 'https://svc1.magensa.net/rms/api';
let defaultRMSAPIKey = 'TVRQdWJsaWMtQUVFQ0Q0NEEtODc1NS00QUEwLUFENTgtNTNDMzNGQkJCNEE4';
let defaultRMSProfileName = 'TWFnVGVrX1Byb2R1Y3Rpb24=';
let ShowDeviceResponses = true;

let retval = "";
let _DeviceDetected = false;
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
  mt_UI.CheckForDevice(mt_MMS.type);
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
  mt_UI.DeviceDisplay("");
}
async function handleClearButton() {
  
  let imgData = document.getElementById('imagedata');
  imgData.innerHTML = "";
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  document.getElementById("fileInput").value = null;  
}

async function handleOpenButton() {
  mt_UI.CheckForHID();
  window.mt_device_hid = await mt_MMS.openDevice();
}

async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}

async function parseCommands(description, messageArray) {
  for (let index = 0; index < messageArray.length; index++) 
  {
    let progress = parseInt((index / messageArray.length) * 100);
    updateProgress(`Loading ${description}`, progress);
    await parseCommand(messageArray[index]);
  }
  updateProgress(`Done Loading ${description}...`, 100);
};

function updateProgress(caption, progress ){
  EmitObject({ Name: "OnRMSProgress", Data: {Caption: caption, Progress: progress }});
};


async function parseCommand(message) {
  let Response;

  let sn = "";
  let fw = "";
  let hexData = null;
  let b64Data = null;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      //mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      //mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      Response = await mt_MMS.sendCommand(cmd[1]);
      //mt_UI.LogData(Response.HexString)
      break;
    case "SENDBASE64COMMAND":
      Response = await mt_MMS.sendBase64Command(cmd[1]);
      //mt_UI.LogData(Response.HexString)
      break;
    case "PCIRESET":
      Response = await mt_MMS.sendCommand("AA00810401121F0184021F01");      
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
      _DeviceDetected = false;
      let numSecs = parseInt((cmd[1] /1000),10);
      let numQseconds = parseInt((numSecs * 4),10)
      let index = 0
      while (index < numQseconds && !_DeviceDetected) {
        let progress = parseInt((index / numQseconds) * 100);
        await mt_Utils.wait(250);
        updateProgress(`Waiting up to ${numSecs} seconds...`, progress)  
        index++
      }
      if(_DeviceDetected){
        updateProgress(``, 100)
        await mt_Utils.wait(1000);
      }      
      break;
    case "DETECTDEVICE":
      await mt_MMS.closeDevice();
      await mt_MMS.openDevice();
      await mt_Utils.wait(_openTimeDelay);
      if (window.mt_device_hid.opened) _DeviceDetected = true;
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
    case "XML2JSON":
      let dictionary = {};
      dictionary = mt_XML2JSON.XmltoDict(cmd[1]);      
      for (var key in dictionary) {
        if (dictionary.hasOwnProperty(key))
          {
            mt_UI.LogData(`${key}: ${dictionary[key]}` );
          }
      }
      break;
    case "PARSEMMS":
      retval = mt_Utils.newMMSParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      let offset = 8;
      switch (retval.MsgType) {
        case "01":
          offset = 8;
          break;
        case "02":
          offset = 12;
          break;
        case "81":
          offset = 8;
          break;
        case "82":
          offset = 0;
          break;
        default:
          offset = 8;
          break;
      }

      
      let TLVs = mt_Utils.newtlvParse(retval.TLVData.substring(offset));      
      TLVs.forEach(element => {
      mt_UI.LogData(`${element.tag} : ${element.tagValue} `);    
     
      let innerTLVs = mt_Utils.newtlvParse(element.tagValue);  
      if(innerTLVs.length == 0 )
      {
        mt_UI.LogData(`${element.tag} ─> ${element.tagValue} `);    
      }
      else
      {
        mt_UI.LogData(`${element.tag}  ──┐`);   
        innerTLVs.forEach(el => {
          mt_UI.LogData(`           └─>${el.tag} ─> ${el.tagValue} `);   
        })
      }
      });   
      break;
    
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    case "GETDEVICESN":
      sn = await mt_MMS.GetDeviceSN();
      mt_UI.LogData(sn);
      break;
    case "GETFIRMWAREID":
      fw = await mt_MMS.GetDeviceFWID();
      mt_UI.LogData(fw);
      break;
    case "UPDATEFIRMWARERMS":
      updateFirmwareRMS(cmd[1]); 
      break;
    case "UPDATETAGSRMS":
      updateTagsRMS(); 
      break;
    case "HEXTOBASE64":
      b64Data = mt_Utils.hexToBase64(cmd[1])
      mt_UI.LogData(b64Data);
      break;
    case "BASE64TOHEX":
      hexData = mt_Utils.base64ToHex(cmd[1])
      mt_UI.LogData(hexData);
      break;
      case "UPDATEFIRMARE":  case "UPDATEFIRMWARE":
      let fwResponse =  await mt_MMS_Commands.GetLoadFimrwareFromBase64(cmd[1],cmd[2]);
      window.mt_device_CommitCmd = fwResponse.commitCmd;
      await mt_MMS.sendCommand(fwResponse.firmwareCmd);
      break;
    case "HEXTOBASE64":
      b64Data = mt_Utils.hexToBase64(cmd[1])
      mt_UI.LogData(b64Data);
      break;
    case "BASE64TOHEX":
      hexData = mt_Utils.base64ToHex(cmd[1])
      mt_UI.LogData(hexData);
      break;
    case "SETACTIVEMODE":
      mt_MMS.setActiveCommandMode(cmd[1])
      break;
    case "LOADSIGNATURE":
      loadSignature(cmd[1]); 
      break;  
    case "PARSEHARDWAREID":
      mt_UI.LogData(JSON.stringify(mt_Utils.parseHardwareID(cmd[1])));
      break;  
    default:
      mt_Utils.debugLog(`Unknown Command ${cmd[0]}`);
  }
};

function ClearAutoCheck() {
  let chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

const deviceConnectLogger = async (e) => {
  mt_UI.setUSBConnected("Connected");
  if (window.mt_device_WasOpened) 
  {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
  }
};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
  _DeviceDetected = false;
};
const deviceOpenLogger = async (e) => {
  mt_UI.setUSBConnected("Opened");
  _DeviceDetected = true;
   let cmds = await mt_Utils.FetchCommandsfromURL("cmds/onOpen.txt");
   if (cmds.status.ok){
     await parseCommands('Updating Device', cmds.data);
   }
   
  //  ShowDeviceResponses = false;
  //  let sn = await mt_MMS.GetDeviceSN();
  //  let fw = await mt_MMS.GetDeviceFWID();
  //  mt_UI.LogData(`here is the info: ${sn}  : ${fw}`);
  //  ShowDeviceResponses = true;
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const hostActionCompleteLogger = async (e) => {
  
  
  let tag82 = mt_Utils.getTagValue("82", "", e.Data, false);
  

  switch (tag82) {
    case "01010101":  //Sig Cap complete
      mt_UI.LogData(`Getting Signature`);
      let tag83 = mt_Utils.getTagValue("83", "", e.Data, false);
      ShowDeviceResponses = false;
      //this function will have the device return a file via the onFile event
      await mt_MMS.sendCommand(`AA0081040109D821840BD8218104${tag83}870101`);
      ShowDeviceResponses = true;
      break;
    case "05040100": //Playing Sound
      mt_UI.LogData(`Done Playing Sound`);
      break;
    default:
      mt_UI.LogData(`Host Action: ${e.Name}: ${e.Data}`);
      mt_UI.LogData(`Unhandled hostActionComplete: ${tag82}`);
      break;
  }
};

const NFCUIDLogger = async (e) => {
  let resp = null;
  let index = 0;
  let tagData = "";
  let tag = "";

ShowDeviceResponses = false;
mt_UI.LogData(`Received NFC UID : ${e.Name}: ${e.Data}`);
//  if (tagData.length == 0){
//    mt_UI.LogData(`Reading Fast`);
//        resp = await mt_MMS.sendCommand(`AA0081 04 0126110084 0D 1100 8103 30 002C   8201008301FF`);  
//        let tag84 = mt_Utils.getTagValue("84", "", resp.TLVData, false); 
//        let tag82 = mt_Utils.getTagValue("82", "", tag84.substring(4), false); 
//        let tagFC = mt_Utils.getTagValue("FC", "", tag82, false); 
//        tag =  mt_Utils.getTagValue("DF7A", "", tagFC, false);
//        tagData =  tagData + tag;
//    }
   mt_UI.LogData(`Reading sequentially`);
   for (index = 0; index <= 0x40; index ++ )
     {
       resp = await mt_MMS.sendCommand(`AA00810401261100840C1100810230${mt_Utils.makeHex(index*4, 2)}820100830100`);  
       let tag84 = mt_Utils.getTagValue("84", "", resp.TLVData, false); 
       let tag82 = mt_Utils.getTagValue("82", "", tag84.substring(4), false); 
       let tagFC = mt_Utils.getTagValue("FC", "", tag82, false); 
       tag =  mt_Utils.getTagValue("DF7A", "", tagFC, false);
       if (tag == `00000000000000000000000000000000`) break;
       mt_UI.LogData(`Reading page: ${index} : ${tag}`);
       tagData =  tagData + tag;
     } 
     resp = await mt_MMS.sendCommand(`AA00810401261100840C1100810230${mt_Utils.makeHex(index*4, 2)}8201008301FF`);  


    //this is to demo opening web pages from a URI that was read via NFC 
    //let retData = mt_Utils.getTagValue("DF7A", "", resp, false)
    if(tagData.length > 0 )
    {
        let StartPos = tagData.indexOf("5504");
        if(StartPos > 0 )
        {
            let len = parseInt(tagData.substring(StartPos-2,StartPos),16) * 2 - 2;
            let uri = mt_Utils.hexToASCII(tagData.substring(StartPos + 4, StartPos+4 + len));
            mt_UI.LogData(`Opening: ${uri}` );
            window.open(`https://${uri}`, '_blank');
        }
    }
    ShowDeviceResponses = true;

};


const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
  
  let TLVs = mt_Utils.tlvParser(e.Data.TLV.substring(24));
  mt_UI.PrintTLVs(TLVs);
  
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
   let TLVs = mt_Utils.tlvParser(e.Data.substring(4));
   mt_UI.PrintTLVs(TLVs);
   
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};
const fromDeviceLogger = (e) => {
  if (ShowDeviceResponses)
  {
    mt_UI.LogData(`Device Response: ${e.Data.HexString}`);

    //if (e.Data.OperationStatusCode != "00"){
      mt_UI.LogData(`Device Response Status Code: ${e.Data.OperationStatusCode}${e.Data.OperationDetailCode}`);
      mt_UI.LogData(`Device Response Status: ${e.Data.OperationStatus} : ${e.Data.OperationDetail}`);
    //}
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
  //let chk = document.getElementById("chk-AutoTouch");
  //if (chk.checked) {
    mt_UI.LogData(`Touch Up: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  //}
};

const touchDownLogger = (e) => {
  //let chk = document.getElementById("chk-AutoTouch");
  //if (chk.checked) {
    mt_UI.LogData(`Touch Down: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  //}
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
      _AwaitingContactEMV = false;
      // We didn't get a contact seated, do start the contactless transaction
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
  let chk = document.getElementById("chk-AutoEMV");
  let _autoStart = document.getElementById("chk-AutoStart");
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
  let chk = document.getElementById("chk-AutoMSR");
  let _autoStart = document.getElementById("chk-AutoStart");
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

const fileLogger = async (e) => {
  let tag84 = mt_Utils.getTagValue("84", "", e.Data.TLVData.substring(8), false);
  let tagC1 = mt_Utils.getTagValue("C1", "", tag84.substring(16), false);

  switch (tagC1) {
    case '01000000':  //  Signature Capture File
       let tagCE = mt_Utils.getTagValue("CE", "", tag84.substring(16), false);
       mt_UI.LogData(`Signature Data: ${tagCE}`);
       loadSignature(tagCE);
      break;
  
    default:
      //mt_UI.LogData(`File: ${tagC1} - ${e.Data.HexString}`);
      
      break;
  }

};


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
      case "fw-wifi":
        await parseFirmwareFile(file, 2)
        break;
      case "fw-ble":
        await parseFirmwareFile(file, 3)
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
        //mt_UI.LogData(`commit ${response.commitCmd}`);
        //mt_UI.LogData(`fw ${response.firmwareCmd}`);
      window.mt_device_CommitCmd = response.commitCmd;
      mt_MMS.sendCommand(response.firmwareCmd);
    };
  reader.readAsArrayBuffer(file); 
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


const displayProgressLogger = (e) => {
  let progress = parseInt((e.Progress / e.Total) * 100);

  mt_UI.updateProgressBar("Sending Command", progress);
  if(e.Progress == (e.Total-1)){
    mt_UI.updateProgressBar("",-1);  
  }
};

const firmwareUpdateLogger = (e) =>{
switch (e.Data) {
    case "820408010903":
      if (window.mt_device_CommitCmd != undefined)
        {
          mt_UI.LogData("Committing Firmware...");
          mt_MMS.sendCommand(window.mt_device_CommitCmd);  
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

async function updateFirmwareRMS(fwSpec){
  
  let fwType = "fw-main";

  if (fwSpec) fwType = fwSpec;
  
  let fw = null;

  let startTime = Date.now();
  mt_RMS_API.setURL(mt_Utils.getEncodedValue('RMSBaseURL', defaultRMSURL, false));
  mt_RMS_API.setAPIKey(mt_Utils.getEncodedValue('RMSAPIKey',defaultRMSAPIKey));
  mt_RMS_API.setProfileName(mt_Utils.getEncodedValue('RMSProfileName',defaultRMSProfileName));
  
  ShowDeviceResponses = false;
  
  
    switch (fwType.toLowerCase()) {
    case "fw-boot":
      fw = await mt_MMS.GetDeviceBootFWID();
      break;
    case "fw-wifi":
      fw = await mt_MMS.GetDeviceWifiFWID();
      break;
    case "fw-ble":
      fw = await mt_MMS.GetDeviceBLEFWID();
      break;
    default:
    fw = await mt_MMS.GetDeviceFWID();
    break;
  }

  let sn = await mt_MMS.GetDeviceSN();
  ShowDeviceResponses = true;

  if(mt_RMS_API.BaseURL.length > 0 && mt_RMS_API.APIKey.length > 0 && mt_RMS_API.ProfileName.length > 0)
  {        
    if (fw.length > 0)
    {
      await updateFirmwareRMSWebAPI(fw,sn);    
    }
    
    let endTime = Date.now();
    let executionTimeMs = endTime - startTime;
    let executionTimeSec = executionTimeMs / 1000;
    mt_UI.LogData(`Execution time: ${executionTimeSec} seconds`);
    ShowDeviceResponses = false;
    await mt_MMS.sendCommand('AA0081040155180384081803810100820114');
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
  let fw = await mt_MMS.GetDeviceFWID();
  let sn = await mt_MMS.GetDeviceSN();
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
    mt_UI.LogData(`Checking Firmware ${fwID}...`);
    let strVersion = mt_Utils.getEncodedValue("RMSVersion","");    
    ShowDeviceResponses = false;
    //Sending Please Wait
    //await mt_MMS.sendCommand('AA008104015518038408180381010082010E');    
    let cmds = await mt_Utils.FetchCommandsfromURL("cmds/DisplayLoadingFirmware.txt");
    if (cmds.status.ok)
    {
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
           if(firmwareResp.data.HasBLEFirmware)
          {
          } 
          if(firmwareResp.data.DeviceConfigs != null)
          {
          } 

    switch (firmwareResp.data.ResultCode) {
      case 0:
        mt_UI.LogData(`The ${firmwareResp.data.Description} has an update available!`);
        if (firmwareResp.data.Commands.length > 0) {
          if(firmwareResp.data.ReleaseNotes.length > 0 ) mt_UI.LogData(firmwareResp.data.ReleaseNotes);
            if(firmwareResp.data.HasBLEFirmware){
            mt_UI.LogData("This reader has BLE firmware");
          } 
          if(firmwareResp.data.DeviceConfigs != null){
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
  //  let updateCommands = [
  //  "AA0081040108D8218408D825810400000000",
  //  "AA0081040108D8218408D825810400000100",
  //  "AA0081040108D8218408D825810400000200",
  //  "AA0081040108D8218408D825810400000300",
  //  "AA0081040108D8218408D825810400000400",
  //  "AA0081040108D8218408D825810400000500",
  //  "AA0081040108D8218408D825810400000600",
  //  "AA0081040108D8218408D825810400000700",
  //  "AA0081040108D8218408D825810400000800",
  //  "AA0081040108D8218408D825810400000900"
  //  ];
  let updateCommands = [
    "AA0081040108D8218408D825810400000000",
    "AA0081040108D8218408D825810400000100",
    "AA0081040108D8218408D825810400000200",
    "AA0081040108D8218408D825810400000300"
    ];


   for (let index = 0; index < updateCommands.length; index++) {
    ShowDeviceResponses = false;
    mt_UI.LogData(`Updating Tags and CAPKs`);
    resp = await mt_MMS.sendCommand(updateCommands[index]);
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
        mt_UI.LogData(`${tagsResp.data.Result}`);
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


async function loadSignature(data){
  let tagCE = data;
  let tag81 = mt_Utils.getTagValue("81", "000000FD00000078", tagCE, false);
  let tag82 = mt_Utils.getTagValue("82", "", tagCE, false);
  let imageWidth = mt_Utils.hexToNumber(tag81.substring(0,8));
  let imageHeight = mt_Utils.hexToNumber(tag81.substring(8,16));
  let image  = await mt_MMS_Commands.getImgFromPenData(tag82,imageWidth,imageHeight, 3, 'white', 'black','image/png', 1);
  let img = document.createElement('img');
  img.alt = 'signature';
  img.setAttribute('src', image);
  let imgData = document.getElementById('imagedata');
  imgData.append(img);
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

EventEmitter.on("OnUIHostActionComplete", hostActionCompleteLogger);

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

EventEmitter.on("OnDeviceSendProgress", displayProgressLogger);