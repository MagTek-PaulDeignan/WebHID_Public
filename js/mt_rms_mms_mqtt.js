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

"use strict";
//import * as mt_mms from "./API_mmsHID.js";
import * as mt_mms from "./API_mmsMQTT.js";
import * as mt_Utils from "./mt_utils.js";
import * as mt_RMS_API from "./API_rms.js";

let _KSN = "";
let _UIK = "";

let _BLEFWID = "";
let _MUT = "";

export var _DeviceSN = "";
export var  _FWID = "";


let _DeviceDetected = false; 
let _HasBLEFirmware = false;
let _DeviceConfigList = null;
let  _openTimeDelay = 2000;

export function setDeviceDetected(bval) {
  _DeviceDetected = bval;
};

  /**
   * @param {string} sn
   */
  export function setDeviceSN(sn) {
    _DeviceSN = sn;
  }

  /**
   * @param {string} id
   */
  export function setFWID(id) {
    _FWID = id;
  }


function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

function LogData(data){
  EmitObject({ Name: "OnRMSLogData", Data: data });
};

function updateProgress(caption, progress ){
  EmitObject({ Name: "OnRMSProgress", Data: {Caption: caption, Progress: progress }});
};


export async function updateDevice() {
  var bStatus = true;
  _DeviceConfigList = null;
  try {
    LogData(`${mt_RMS_API.ProfileName}: Checking for updates...`);
    //bStatus = await getDeviceInfo();
    //bStatus = await updateFirmware("Main");
    //if (_HasBLEFirmware)
    //{
    //  bStatus = await updateFirmware("BLE");
    //}
    bStatus = await updateAllTags();
    //bStatus = await updateAllConfigs();
    LogData(`Device has been updated`);
    updateProgress("", -1);
  } catch (error) 
  {
    LogData(`${error.message}`);
  }
};

async function updateAllTags() {
  LogData(`Checking Tags and CAPKs...`);
  let bStatus = false;
  
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
    bStatus = await updateMMSTags(updateCommands[index]);
  }
  return bStatus;
};

async function getDeviceInfo() {
 //_DeviceSN = await mt_mms.GetDeviceSN(); 
 //_FWID = await mt_mms.GetDeviceFWID();
  return true;
};

async function parseRMSCommands(description, messageArray) {
  for (let index = 0; index < messageArray.length; index++) 
  {
    var progress = parseInt((index / messageArray.length) * 100);
    updateProgress(`Loading ${description}`, progress);
    await parseRMSCommand(messageArray[index]);
  }
  updateProgress(`Done Loading ${description}...`, 100);
};

async function updateMMSTags(command) {
  try {
    let ver = null;
      let strVersion = mt_Utils.getEncodedValue("RMSVersion","");
      strVersion.length > 0 ? ver = parseInt(strVersion) : ver = null;


    let cmdResp = await mt_mms.sendCommand(command);    
    if (cmdResp.HexString.length > 16) {
      let req = {
        Authentication: null,
        ProfileName: mt_RMS_API.ProfileName,
        ConfigurationName: null,
        Version: ver,
        UIK: null,
        TerminalConfiguration: cmdResp.HexString,
        BillingLabel: mt_Utils.getEncodedValue("RMSBillingLabel","V0VCIERlbW8gVGVzdA=="),
        InterfaceType: mt_Utils.getEncodedValue("RMSInterface","VVNC"),
        DownloadPayload: true,
        FirmwareID: _FWID,
        DeviceSerialNumber: _DeviceSN
    };
      console.log(JSON.stringify(req));
      var tagsResp = await mt_RMS_API.GetTags(req);      
    }

    switch (tagsResp.ResultCode) {
      case -2:        
        break;
      case 0:
        //LogData(`The ${tagsResp.Description} has an update available!`);
        if (tagsResp.Commands.length > 0) {
          await parseRMSCommands(tagsResp.Description, tagsResp.Commands);
        }
        break;
      case 1:
        LogData(`The ${tagsResp.Description} are up to date.`);
        break;
      case 2:
        LogData(`The ${tagsResp.Description} are up to date.`);
        break;
      default:
        LogData(`${tagsResp.Result} ${tagsResp.ResultCode}`);
        break;
    }
    return true;
  } catch (error)
  {
    return error;
  }
};

async function updateAllConfigs() {
  let bStatus = true;
  if(_DeviceConfigList != null)
  {
    bStatus = false;
    LogData(`Checking firmware specific configs...`);
    for (let index = 0; index < _DeviceConfigList.length; index++) 
    {
      bStatus = await getDeviceInfo();
      bStatus = await updateConfig(_DeviceConfigList[index]);      
    }

  }
  return bStatus;
}
async function updateConfig(configname) {
  try {
      let ver = null;
      let strVersion = mt_Utils.getEncodedValue("RMSVersion","");
      strVersion.length > 0 ? ver = parseInt(strVersion) : ver = null;

      let req = {
        Authentication: null,
        ProfileName: mt_RMS_API.ProfileName,
        ConfigurationName: configname,
        TerminalConfiguration: null,
        BillingLabel: mt_Utils.getEncodedValue("RMSBillingLabel","V0VCIERlbW8gVGVzdA=="),
        Version: ver,
        UIK: _UIK,
        MUT: _MUT,
        KSN: _KSN,
        InterfaceType: mt_Utils.getEncodedValue("RMSInterface","VVNC"),
        DownloadPayload: true,
      };
      var configResp = await mt_RMS_API.GetConfig(req);      


    switch (configResp.ResultCode) {
      case 0:
        //LogData(`The ${configResp.Description} has an update available!`);
        if (configResp.Commands.length > 0) {
          await parseRMSCommands(configResp.Description, configResp.Commands);
        }
        break;
      case 1:
        LogData(`The ${configResp.Description} is up to date.`);
        break;
      case 2:
        LogData(`The ${configResp.Description} is up to date.`);
        break;
      default:
        LogData(`${configResp.Result}`);
        break;
    }
    return true;
  } 
  catch (error) 
  {
    return error;
  }
};

async function updateFirmware(fwType) {
  try {
    _HasBLEFirmware = false;
    let fwid ;
    switch (fwType.toLowerCase()) {
      case "ble":
        fwid = _BLEFWID;
        break;
      default:
        fwid = _FWID;
        break;
    }

    LogData(`Checking ${fwType} firmware...`);
    let req = {
      Authentication: null,
      ProfileName: mt_RMS_API.ProfileName,
      ConfigurationName: null,
      Version: null,
      UIK: _UIK,
      MUT: _MUT,
      KSN: _KSN,
      FirmwareID: fwid,
      InterfaceType: "USB",
      DownloadPayload: true,
    };

    var firmwareResp = await mt_RMS_API.GetFirmware(req);
          if(firmwareResp.HasBLEFirmware && fwType.toLowerCase() == "main"){
            _HasBLEFirmware = true;
            //LogData("This reader has BLE firmware");
          } 
          if(firmwareResp.DeviceConfigs != null && fwType.toLowerCase() == "main"){
            _DeviceConfigList = firmwareResp.DeviceConfigs;
            //LogData("This reader has device configs");
          } 

    switch (firmwareResp.ResultCode) {
      case 0:
        //LogData(`The ${fwType} firmware has an update available!`);
        if (firmwareResp.Commands.length > 0) {
          if(firmwareResp.ReleaseNotes.length > 0 ) LogData(firmwareResp.ReleaseNotes);
          if(firmwareResp.HasBLEFirmware && fwType.toLowerCase() == "main"){
            _HasBLEFirmware = true;
            LogData("This reader has BLE firmware");
          } 
          if(firmwareResp.DeviceConfigs != null && fwType.toLowerCase() == "main"){
            _DeviceConfigList = firmwareResp.DeviceConfigs;
            LogData("This reader has device configs");
          } 
          await parseRMSCommands(firmwareResp.Description, firmwareResp.Commands);
        }
        break;
      case 1:
        LogData(`The ${fwType} firmware is up to date.`);
        break;
      case 2:
        LogData(`The ${fwType} firmware is up to date.`);
        break;
      default:
        LogData(`${fwType} ${firmwareResp.Result}`);
        break;
    }
    return true;
  } catch (error) {
    return error;
  }
};
async function parseRMSCommand(message) {
  let Response;
  var cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETDEVINFO":
      //return mt_HID.getDeviceInfo();
      break;
    case "SENDCOMMAND":
      Response = await mt_mms.SendCommand(cmd[1]);
      return Response;
      break;
    case "SENDDATETIME":
      //Response = await mt_mms.sendCommand(mt_V5.calcDateTime());
      //return Response;
      break;
    case "SENDEXTENDEDCOMMAND":
      //Response = await mt_V5.sendExtendedCommand(cmd[1], cmd[2]);
      //return Response;
      break;
    case "SENDEXTCOMMAND":
      //Response = await mt_V5.sendExtCommand(cmd[1]);
      //return Response;
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();
      break;
    case "OPENDEVICE":
      await mt_mms.openDevice();
      break;
    case "CLOSEDEVICE":
      await mt_mms.closeDevice();
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
      await mt_mms.closeDevice();
      await mt_mms.openDevice();
      await mt_Utils.wait(_openTimeDelay);
      if (window.mt_device_hid.opened) _DeviceDetected = true;
      break;
    case "APPENDLOG":
      break;
    case "DISPLAYMESSAGE":
      LogData(cmd[1]);
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      var retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);
      LogData(`Get Tags for ${retval}`);
      break;
    case "PARSETLV":
      var retval = mt_Utils.tlvParser(mt_Utils.hexToBytes(cmd[1]));
      LogData("PARSETLV", JSON.stringify(retval));
      break;
    default:
      LogData(`Unknown Parse Command: ${cmd[0]}`);
  }
};