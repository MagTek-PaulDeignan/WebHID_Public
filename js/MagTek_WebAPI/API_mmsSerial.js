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

import * as mt_Utils from "./mt_utils.js";
import * as mt_MMS from "./API_mmsParse.js";
import * as mt_Configs from "./config/DeviceConfig.js";
import * as mt_SLIP from "./slip.js";
import "./mt_events.js";

export let _activeCommandMode = true;


let _filters = mt_Configs.MMSfilters;
let mtDeviceType = "";
let port_connected = false;
let port = null;
let portReader = null;
let portWriter = null;
let keepReading = true;


async function readUntilClosed() {
  if (port != null)
  {
    while (port && keepReading) 
    {
      try {
        portWriter = port.writable.getWriter();
        portReader = port.readable.getReader();
        while (true) {
          const responsedata = await portReader.read();
          if (responsedata.done) {
            portReader.releaseLock();
            break;
          }
          slipDecoder.decode(new Uint8Array(responsedata.value));          
        }
      } 
      catch (error) 
      {
      portReader.releaseLock();
      portWriter.releaseLock();
      } 
    }
  }
}

const closed = readUntilClosed();

async function writeSlipData(data){
  // in order to write to a Serial/UART we need to add the 
  // direction byte and a 4 byte length.
  // then the data must be slip encoded.
  
  let direction = "00"
  let msgLen = mt_Utils.makeHex(data.length / 2 ,8);
  let bytestoSend = mt_Utils.hexToBytes(`${direction}${msgLen}${data}`)
  await portWriter.write(mt_SLIP.encode(bytestoSend)); 
}
const UnSlippedMessage = function (msg) {
    //the SLIP/UART format has a direction byte and 4 byte length then is removed here
    mt_MMS.ParseMMSMessage(msg.slice(5, msg.length));
};

const slipDecoder = new mt_SLIP.Decoder(
  { onMessage: UnSlippedMessage,
    maxMessageSize: 209715200,
    bufferSize: 2048
  }
  );

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
}

export function setActiveCommandMode(mode){
  _activeCommandMode =  (mode === "true");
}
export async function getDeviceList() {
  let devices = await navigator.serial.getPorts();
  //devices = mt_Configs.filterDevices(devices, _filters);
  return devices;
}

export async function sendBase64Command(cmdToSendB64) {
  return await sendCommand(mt_Utils.base64ToHex(cmdToSendB64));
}

export async function sendCommand(cmdToSend) {
  let cmdResp = "";
  window.mt_device_response = null;
  try {
    if (!_activeCommandMode) {
      EmitObject({
        Name: "OnError",
        Source: "SendCommand",
        Data: "Session not active",
      });
      return;
    }


     if (port == null) {
       EmitObject({
         Name: "OnError",
         Source: "SendCommand",
         Data: "Device is null",
       });
       return 0;
     }
     if (!port_connected) {
       EmitObject({
         Name: "OnError",
         Source: "SendCommand",
         Data: "Device is not open",
       });
       return 0;
     }
    
    
    cmdResp = await sendMMSCommand(mt_Utils.sanitizeHexData(cmdToSend));
    return cmdResp;
  } catch (error) {
    EmitObject({ Name: "OnError", Source: "SendCommand", Data: error });
    return error;
  }
}

async function sendMMSCommand(cmdToSend) {
  await writeSlipData(cmdToSend);
  Response = await waitForDeviceResponse();
  return Response;
};

function waitForDeviceResponse() {
  function waitFor(result) {
    if (result) {
      return result;
    }
    return new Promise((resolve) => setTimeout(resolve, 50))
      .then(() => Promise.resolve(window.mt_device_response)) 
      .then((res) => waitFor(res));
  }
  return waitFor();
}

export async function GetDeviceSN(){
  let resp = await sendCommand("AA0081040100D101841AD10181072B06010401F609850102890AE208E106E104E102C100");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false) ;
  let data = mt_Utils.getTagValue("C1","",tag89, false);
  return data.substring(0,7);
}

export async function GetDeviceFWID(){
  let resp = await sendCommand("AA0081040102D101841AD10181072B06010401F609850102890AE108E206E204E202C200");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false);
  let data = mt_Utils.getTagValue("C2","",tag89, true);
  return data;
}

export async function openDevice() {
  try {
    let reqDevice;
    let devices = await getDeviceList();    
    //port = null;
    //let device = devices.find((d) => d.vendorId === mt_Configs.vendorId);
    port = devices.find((d) => true);
      if (!port) {
      //reqDevice = await navigator.serial.requestPort({filters: _filters });
      reqDevice = await navigator.serial.requestPort();
      if(reqDevice != null)
        {
          // if (reqDevice.length > 0)
          // {
          //   device = reqDevice[0];
          // }
          port = reqDevice;
        }
    }

    //const { usbProductId, usbVendorId } = device.getInfo();
    const info  = port.getInfo();
    mtDeviceType = "MMS_SLIP";    
    if (port.readable == null) {
      await port.open({ baudRate: 115200});
      port_connected = true;
      port.addEventListener("connect", handleConnect);
      port.addEventListener("disconnect", handleDisconnect);      
      readUntilClosed();
}
    EmitObject({Name:"OnDeviceOpen", Device:port});      
    return port;
  } catch (error) {
    EmitObject({Name:"OnError",
      Source: "OpenDevice",
      Data: "Error opening device",
    });
  }
};

export async function closeDevice(){
  
  if (port != null) 
  {
  port_connected = false;
  window.mt_device_WasOpened = false;
  keepReading = false;
  await portReader.cancel();
  await portReader.releaseLock();
  await portWriter.releaseLock();
  await closed;
  port = null;
  portReader = null;
  portWriter = null;
  }
  EmitObject({Name:"OnDeviceClose", Device:port});
  };

function handleConnect(event){
  console.log(JSON.stringify(event));
}

function handleDisconnect(event){
  console.log(JSON.stringify(event));
}

Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};
