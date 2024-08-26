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
let _MUT = "";
let _DeviceDetected =false; 

export function setDeviceDetected(bval) {
  _DeviceDetected = bval;
};

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

function LogData(data){
  EmitObject({ Name: "OnRMSLogData", Data: data });
};

function updateProgressBar(caption, progress ){
  EmitObject({ Name: "OnRMSProgress", Data: {Caption: caption, Progress: progress }});
};
export async function updateDevice() {
  var bStatus = true;
  try {
    LogData(`${mt_RMS_API.ProfileName}: Checking for updates...`);
    bStatus = await getDeviceInfo();
    bStatus = await updateFirmware("main");
    bStatus = await updateAllTags();
    LogData(`Device has been updated`);
    updateProgressBar("", 100);
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
  _KSN = await mt_V5.sendCommand("0900");
  LogData(`   KSN: ${_KSN}`);
  _UIK = await mt_V5.sendCommand("2100");
  LogData(`   UIK: ${_UIK}`);
  _FWID = await mt_V5.sendCommand("00013A");
  LogData(`   FWID: ${_FWID}`);
  _MUT = await mt_V5.sendCommand("1900");
  LogData(`   MUT: ${_MUT}`);
  return true;
};

async function parseRMSCommands(description, messageArray) {
  for (let index = 0; index < messageArray.length; index++) {
    
    const element = messageArray[index];        
    var progress = parseInt((index / messageArray.length) * 100);
    updateProgressBar(`Loading ${description}`, progress);
    await parseRMSCommand(element);
  }
  updateProgressBar(`Done Loading ${description}...`, 100);
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
        LogData(`The ${tagsResp.Description} has an update available!`);
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
async function updateFirmware(fwType) {
  try {
    LogData(`Checking firmware...`);
    let req = {
      Authentication: null,
      ProfileName: mt_RMS_API.ProfileName,
      ConfigurationName: null,
      Version: null,
      UIK: _UIK,
      MUT: _MUT,
      KSN: _KSN,
      FirmwareID: _FWID,
      InterfaceType: "USB",
      DownloadPayload: true,
    };

    var firmwareResp = await mt_RMS_API.GetFirmware(req);
    switch (firmwareResp.ResultCode) {
      case 0:
        LogData(`The ${fwType} firmware has an update available!`);
        if (firmwareResp.Commands.length > 0) {
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
        LogData(`${firmwareResp.Result}`);
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
        updateProgressBar(`Waiting up to ${numSecs} seconds...`, progress)  
        index++
      }
      if(_DeviceDetected){
        updateProgressBar(``, 100)
        await mt_Utils.wait(1000);
      }
      break;
    case "DETECTDEVICE":
      await mt_V5.closeDevice();
      await mt_V5.openDevice();
      if (window._device.opened) _DeviceDetected = true;
      break;
    case "APPENDLOG":
      break;
    case "DISPLAYMESSAGE":
      LogData(cmd[1]);
      break;
    case "GETTAGVALUE":
      var retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3]);
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