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
import * as mt_V5 from "./mt_v5.js";
import * as mt_Utils from "./mt_utils.js";
import * as mt_RMS_API from "./mt_rms_api.js";

let _KSN = "";
let _UIK = "";
let _FWID = "";
let _BLEFWID = "";
let _MUT = "";
let _DeviceDetected =false; 
let _HasBLEFirmware = false;
let _DeviceConfigList = null;
let  _openTimeDelay = 2000;
export function setDeviceDetected(bval) {
  _DeviceDetected = bval;
};

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
    bStatus = await getDeviceInfo();
    bStatus = await updateFirmware("Main");
    if (_HasBLEFirmware)
    {
      bStatus = await updateFirmware("BLE");
    }

    bStatus = await updateAllTags();
    bStatus = await updateAllConfigs();

    LogData(`Device has been updated`);
    updateProgress("", -1);
  } catch (error) {
    LogData(`${error.message}`);
  }
};
async function updateAllTags() {
  LogData(`Checking Tags and CAPKs...`);
  let bStatus = false;
  for (let index = 0; index < 5; index++) {
    bStatus = await updateTags(`0306000801000${index}FA03DFDF26`);
  }
  return bStatus;
};
async function getDeviceInfo() {
  let resp;
  //if in bootlaoder
  if (window._device.productId == 0x5357)
  {
    LogData(`In Bootloader... `);
    _KSN = mt_Utils.getDefaultValue("KSN","")
    _UIK = mt_Utils.getDefaultValue("UIK","")
    _FWID = mt_Utils.getDefaultValue("FWID","")
    _BLEFWID = mt_Utils.getDefaultValue("BLEFWID","")
    _MUT = mt_Utils.getDefaultValue("FWID","")
  }
  else
  {
    resp = await mt_V5.sendCommand("0900");
    if (resp.substring(0,2) == "00"){
      _KSN = resp;
      mt_Utils.saveDefaultValue("KSN",_KSN);
      
    } 
    resp = await mt_V5.sendCommand("2100");
    if (resp.substring(0,2) == "00"){
      _UIK = resp;
      mt_Utils.saveDefaultValue("UIK",_UIK);      
    } 
    resp = await mt_V5.sendCommand("00013A");
    if (resp.substring(0,2) == "00"){
      _FWID = resp;
      mt_Utils.saveDefaultValue("FWID",_FWID);      
    } 
    resp = await mt_V5.getBLEFWID();
    if (resp.substring(0,2) == "00"){
      _BLEFWID = resp;
      mt_Utils.saveDefaultValue("BLEFWID",_BLEFWID);      
    } 
    resp = await mt_V5.sendCommand("1900");
    if (resp.substring(0,2) == "00"){
      _MUT = resp;
      mt_Utils.saveDefaultValue("MUT",_MUT);      
    } 
  }
  return true;
};
async function parseRMSCommands(description, messageArray) {
  for (let index = 0; index < messageArray.length; index++) {
    const element = messageArray[index];        
    var progress = parseInt((index / messageArray.length) * 100);
    updateProgress(`Loading ${description}`, progress);
    await parseRMSCommand(element);
  }
  updateProgress(`Done Loading ${description}...`, 100);
};
async function updateTags(command) {
  try {
    let cmdResp = await mt_V5.sendExtCommand(command);
    if (cmdResp.length > 16) {
      let req = {
        Authentication: null,
        ProfileName: mt_RMS_API.ProfileName,
        ConfigurationName: null,
        TerminalConfiguration: cmdResp,
        BillingLabel: "Web Demo",
        Version: null,
        UIK: _UIK,
        MUT: _MUT,
        KSN: _KSN,
        InterfaceType: "USB",
        DownloadPayload: true,
      };

      var tagsResp = await mt_RMS_API.GetTags(req);      
    }

    switch (tagsResp.ResultCode) {
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
        LogData(`${tagsResp.Result}`);
        break;
    }
    return true;
  } catch (error) {
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
    
    
      let req = {
        Authentication: null,
        ProfileName: mt_RMS_API.ProfileName,
        ConfigurationName: configname,
        TerminalConfiguration: null,
        BillingLabel: "Web Demo",
        Version: null,
        UIK: _UIK,
        MUT: _MUT,
        KSN: _KSN,
        InterfaceType: "USB",
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
      return mt_HID.getDeviceInfo();
      break;
    case "SENDCOMMAND":
      Response = await mt_V5.sendCommand(cmd[1]);
      return Response;
      break;
    case "SENDDATETIME":
      Response = await mt_V5.sendCommand(mt_V5.calcDateTime());
      return Response;
      break;
    case "SENDEXTENDEDCOMMAND":
      Response = await mt_V5.sendExtendedCommand(cmd[1], cmd[2]);
      return Response;
      break;
    case "SENDEXTCOMMAND":
      Response = await mt_V5.sendExtCommand(cmd[1]);
      return Response;
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();
      break;
    case "OPENDEVICE":
      await mt_V5.openDevice();
      break;
    case "CLOSEDEVICE":
      await mt_V5.closeDevice();
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
      await mt_V5.closeDevice();
      await mt_V5.openDevice();
      await mt_Utils.wait(_openTimeDelay);
      if (window._device.opened) _DeviceDetected = true;
      break;
    case "APPENDLOG":
      break;
    case "DISPLAYMESSAGE":
      LogData(cmd[1]);
      break;
    case "GETTAGVALUE":
      var retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], Boolean(cmd[4]));
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