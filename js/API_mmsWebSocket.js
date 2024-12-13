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
import * as mt_MMSParse from "./API_mmsParse.js";
import "./mt_events.js";

let _wsAddress = "";
let MTWebSocket = null;

/**
 * @param {string} URL
 */
export function setURL(URL) {
  _wsAddress = URL;
};


function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

export async function OpenWS(){

  if(MTWebSocket == null || MTWebSocket.readyState != 1)
    {
      MTWebSocket = new WebSocket(_wsAddress);
      MTWebSocket.binaryType = "arraybuffer";
      MTWebSocket.onopen = ws_onopen;
      MTWebSocket.onerror = ws_onerror;
      MTWebSocket.onmessage = ws_onmessage;
      MTWebSocket.onclose = ws_onclose;
  } 
};

export async function CloseWS(){
  if(MTWebSocket != undefined){
    if(MTWebSocket.readyState == 1){
      EmitObject({Name:"OnDeviceClose", Device:null});
      MTWebSocket.onopen = null;
      MTWebSocket.onerror = null;
      MTWebSocket.onmessage = null;
      MTWebSocket.onclose = null;
      MTWebSocket.close();
      MTWebSocket = undefined;
    }
  }
};

export async function SendCommand(cmdHexString) {
  window.mt_device_response = null;
  MTWebSocket.send(cmdHexString);    
  let Resp = await waitForDeviceResponse();
  return Resp;

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
};


function ws_onopen() {
    EmitObject({Name:"OnDeviceOpen", Device:MTWebSocket}); 
  };

function ws_onerror(error) {
    
    EmitObject({Name:"OnError",
      Source: "WSSError",
      Data: error
    });

  };

function ws_onmessage(ws_msg) {			
    let dataArray
    if( typeof ws_msg.data == 'string')
    {
      dataArray = mt_Utils.hexToBytes(ws_msg.data);
    }
    else
    {
      dataArray = new Uint8Array(ws_msg.data);
    }
    processMsg(dataArray);
  };

function ws_onclose(e) {
    
  };

  
function processMsg(msg) {
    mt_MMSParse.ParseMMSMessage(msg);
  };




