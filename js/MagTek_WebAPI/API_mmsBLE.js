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
import "./mt_events.js";
export let _activeCommandMode = true;


let messageSndCounter = 0;
let messageRcvCounter = 0;
let device; //  the connected Bluetooth device
let dynaFlexService;
let messageFromHostCharacteristic;
let messageToHostCharacteristic;
let bleReceivedData = 
  {
    MsgNumber: 0,
    MsgLen: 0,
    Data: []
  }

const DYNAFLEX_SERVICE_UUID = '0cba14b7-ff24-47b0-be09-26440538530c';
const MESSAGE_FROM_HOST_CHARACTERISTIC_UUID = '47f05ffa-5909-4969-bc57-250d47e874e5';
const MESSAGE_TO_HOST_CHARACTERISTIC_UUID = 'fed49118-c7e2-4a61-9ed5-e6dd65c3071b';

let _filters = mt_Configs.MMSfilters;
let mtDeviceType = "";

function EmitObject(e_obj) 
{
  EventEmitter.emit(e_obj.Name, e_obj);
}

export function setActiveCommandMode(mode) 
{
  _activeCommandMode =  (mode === "true");
}

function getMessageLength(message) 
{
  let buffer = message.slice(3,7);
  let length = (buffer[0] * 0x1000000) + (buffer[1] * 0x10000) + (buffer[2] * 0x100) + buffer[3];
  return length;
}


function parseBLEPDU(message) {
  let buffer =  new Uint8Array(message.buffer);
  //console.log(`Length of PDU: ${buffer.length}`)
  let _MessageCounter = buffer[0];
  let _PDUCounter = buffer[1];
  switch (_PDUCounter ) 
  {
    case 0:            
        bleReceivedData.MsgLen =  getMessageLength(buffer);                     
        //console.log(`Length of Message: ${_MessageCounter}: ${bleReceivedData.MsgLen}`)
        bleReceivedData.Data = [];
        bleReceivedData.Data.push(... buffer.slice(7));
        break;
    default:
        bleReceivedData.Data.push(... buffer.slice(2));
        break;
  }
      
  if (bleReceivedData.Data.length >= bleReceivedData.MsgLen )
  {
    mt_MMS.ParseMMSMessage(bleReceivedData.Data);
  }
}

// Function to handle incoming notifications from the "Message To Host" characteristic
function handleMessageToHostNotifications(event) {
  parseBLEPDU(event.target.value);            
}


// Function to handle device disconnection
function onDisconnected(event) {
  const disconnectedDevice = event.target;
  device = null; // Clear the device reference
  dynaFlexService = null;
  messageFromHostCharacteristic = null;
  messageToHostCharacteristic = null;
  EmitObject({Name:"OnDeviceClose", Device:device});
}



export async function getDeviceList() 
{
  //let devices = await navigator.bluetooth.getDevices();
  //devices = mt_Configs.filterDevices(devices, _filters);
  //return devices;
  return [];
}

export async function sendBase64Command(cmdToSendB64) 
{
  return await sendCommand(mt_Utils.base64ToHex(cmdToSendB64));
}

export async function sendCommand(cmdToSend) 
{
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


    if (device == null) {
      EmitObject({Name: "OnError", Source: "SendCommand", Data: "Device is null"});
      return 0;
    }
    if (!device.gatt.connected) {
      EmitObject({Name: "OnError", Source: "SendCommand", Data: "Device is not open"});
      return 0;
    }
        
    cmdResp = await sendMMSBLECommand(mt_Utils.sanitizeHexData(cmdToSend));
    return cmdResp;
  } catch (error) {
    EmitObject({ Name: "OnError", Source: "SendCommand", Data: error });
    return error;
  }
}

async function sendMMSBLECommand(cmdToSend) {
  //console.log(`  Writing CMD: ${cmdToSend} `);
  let commands = generatePDUsForMessage(cmdToSend);
  for (let index = 0; index < commands.length; index++) {
    //console.log(`    Writing PDUs : ${commands[index]} `);
    await messageFromHostCharacteristic.writeValueWithResponse(commands[index]);    
    EmitObject({Name:"OnDeviceSendProgress", Total: commands.length, Progress: index});
  }
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

export async function GetDeviceSN() {
  let resp = await sendCommand("AA0081040100D101841AD10181072B06010401F609850102890AE208E106E104E102C100");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false) ;
  let data = mt_Utils.getTagValue("C1","",tag89, false);
  return data.substring(0,7);
}

export async function GetBLEFWID() {
  let resp = await sendCommand("AA0081040108D101841AD10181072B06010401F609850102890AE108E206E704E102C100");
  let str = resp.TLVData.substring(24);  
  let tag89 = mt_Utils.getTagValue("89","",str, false);
  let data = mt_Utils.getTagValue("C1","",tag89, true);
  return data;
}

export async function openDevice() {
  try {
    let server = null;
    let reqDevice;
    let devices = await getDeviceList();    
    //device = devices.find((d) => d.vendorId === mt_Configs.vendorId);
    //device = devices.find((d) => true);    
    if (!device) {
    //reqDevice = await navigator.bluetooth.requestDevice({
    device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [DYNAFLEX_SERVICE_UUID]}],
            optionalServices: [DYNAFLEX_SERVICE_UUID]
            });

    // if(reqDevice != null)
    // {
    //    device = reqDevice;      
    // }
    }

                // Add a listener for when the device disconnects
                device.removeEventListener('gattserverdisconnected', onDisconnected);
                device.addEventListener('gattserverdisconnected', onDisconnected);

                //console.log(`Connecting to "${device.name || device.id}"...`);

                // Connect to the GATT server
                server = await device.gatt.connect();

                if (!server) {
                    throw new Error('Failed to establish GATT connection or retrieve GATT server.');
                }

                window.mt_device_WasOpened = true;      
                EmitObject({Name:"OnDeviceOpen", Device:device});

                console.log('info', 'Discovering services and characteristics...');
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms
                // Get the DynaFlex service
                dynaFlexService = await server.getPrimaryService(DYNAFLEX_SERVICE_UUID);
                //console.log('DynaFlex Service:', dynaFlexService);

                // Get the "Message From Host" characteristic
                messageFromHostCharacteristic = await dynaFlexService.getCharacteristic(MESSAGE_FROM_HOST_CHARACTERISTIC_UUID);
                //console.log('Message From Host Characteristic:', messageFromHostCharacteristic);

                // Get the "Message To Host" characteristic
                messageToHostCharacteristic = await dynaFlexService.getCharacteristic(MESSAGE_TO_HOST_CHARACTERISTIC_UUID);
                //console.log('Message To Host Characteristic:', messageToHostCharacteristic);

                // Enable notifications for "Message To Host" characteristic
                await messageToHostCharacteristic.startNotifications();
                messageToHostCharacteristic.addEventListener('characteristicvaluechanged', handleMessageToHostNotifications);
                //console.log('Notifications enabled for "Message To Host".');

                //console.log(`name: ${device.name}, id: ${device.id}`);
                //console.log('Connected to:', device);
                //console.log('GATT Server:', server);
                return device;

            } catch (error) {
                EmitObject({Name:"OnError", Source: "OpenDevice", Data: error.message});
            }
    //
};

export async function closeDevice(){
  window.mt_device_WasOpened = false;
  if (device && device.gatt.connected) 
    {
      console.log('Disconnecting from device...');
      if (messageToHostCharacteristic) {
        try {
              await messageToHostCharacteristic.stopNotifications();
              messageToHostCharacteristic.removeEventListener('characteristicvaluechanged', handleMessageToHostNotifications);    
              
              //console.log('Notifications stopped and event listener removed.');
            } 
        catch (error) 
            {
              //console.warn('Failed to stop notifications or remove event listener:', error);
            }
      }
    device.gatt.disconnect();
    } 
};


/**
 * Generates an array of PDUs (Protocol Data Units) from a given application message.
 * Each PDU is formatted as a Uint8Array, ready to be sent as a Bluetooth LE characteristic value.
 *
 * @param {string} applicationPayloadHex The application message data as a hexadecimal string.
 * @returns {Uint8Array[]} An array of PDUs. Each PDU is a Uint8Array.
 * if an error occurs during hex conversion.
 */
function generatePDUsForMessage(applicationPayloadHex ) {
    if (!applicationPayloadHex) return [];
    let appBytes = [];
    let totalMessageLength = 0;
    let pdus = [];
    let pduCounter = 0; // PDU counter for the current message
    let bytesProcessed = 0;
    let MAX_PDU_CHARACTERISTIC_VALUE_LENGTH = 244; // Max size of the entire PDU characteristic value
    
    let currentPduBytesList = []; // Use a dynamic list to build PDU bytes
    let dataChunkLength = 0;
    let headerSize = 0; 
    let maxDataInThisPdu = 0;
    try 
    {
        appBytes = mt_Utils.hexToBytes(applicationPayloadHex);
        totalMessageLength = appBytes.length;
    } 
    catch (e) 
    {
        console.error("Error converting application payload hex to bytes:", e.message);
        return [];
    }

    // The loop must run at least once, even for an empty message (totalMessageLength === 0),
    // to generate the initial PDU with the message length.
    do {
        
        currentPduBytesList = [];
        // Byte 0: Message Counter
        currentPduBytesList.push(messageSndCounter);
        // Byte 1: PDU Counter
        currentPduBytesList.push(pduCounter);
        
        switch (pduCounter) {
          case 0:
            // This is the first PDU of the message
            // Byte 2: Protocol Control Byte (PCB)
            currentPduBytesList.push(0x00); // PCB is always 0 as per spec

            // Bytes 3-6: Total Message Length (Big Endian)
            currentPduBytesList.push((totalMessageLength >> 24) & 0xFF);
            currentPduBytesList.push((totalMessageLength >> 16) & 0xFF);
            currentPduBytesList.push((totalMessageLength >> 8) & 0xFF);
            currentPduBytesList.push(totalMessageLength & 0xFF);

            headerSize = 7; // MsgCtr(1) + PduCtr(1) + PCB(1) + TotalLen(4)
            maxDataInThisPdu = MAX_PDU_CHARACTERISTIC_VALUE_LENGTH - headerSize;
            dataChunkLength = Math.min(totalMessageLength - bytesProcessed, maxDataInThisPdu);

            // Append application data chunk
            for (let i = 0; i < dataChunkLength; i++) 
            {
                currentPduBytesList.push(appBytes[bytesProcessed + i]);
            }
            break;
        
          default:

          
            // These are subsequent PDUs for the message
            headerSize = 2; // MsgCtr(1) + PduCtr(1)
            maxDataInThisPdu = MAX_PDU_CHARACTERISTIC_VALUE_LENGTH - headerSize;
            dataChunkLength = Math.min(totalMessageLength - bytesProcessed, maxDataInThisPdu);
            // Append application data chunk
            for (let i = 0; i < dataChunkLength; i++) 
            {
                currentPduBytesList.push(appBytes[bytesProcessed + i]);
            }
            break;
        }
        
        bytesProcessed += dataChunkLength;
        pdus.push(new Uint8Array(currentPduBytesList));
        
        if (bytesProcessed >= totalMessageLength) 
        {
            break; // All application data has been processed and put into PDUs
        }
        
        // Update PDU counter for the next PDU
        if (pduCounter === 0xFF) 
        {
          pduCounter = 1; // Rolls over to 1 (0 is reserved for the first PDU)
        }
        else
        {
          pduCounter++;
        }
    } while (true); // The loop breaks when all bytes are processed
    updateMessageSndCounter();
    return pdus;
}


function updateMessageSndCounter(){
  // Update messageSendCounter counter for the next messageSend
  if ( messageSndCounter === 0xFF) 
  {
    messageSndCounter = 0; // Rolls over to 0 
  } 
  else 
  {
    messageSndCounter++;
  }
}

  