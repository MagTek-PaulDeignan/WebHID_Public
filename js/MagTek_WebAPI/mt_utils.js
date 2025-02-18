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

export function byteArrayToBase64(byteArray) {
  const binaryString = Array.from(byteArray)
      .map(byte => String.fromCharCode(byte))
      .join('');
  return btoa(binaryString);
}

export function base64ToByteArray(base64) {
  const binaryString = atob(base64);
  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
  }
  return byteArray;
}
export function hexToBase64(hexstring){
  let bytearray = hexToBytes(hexstring);
  return byteArrayToBase64(bytearray);
}

export function base64ToHex(b64string){
  let bytearray = base64ToByteArray(b64string);
  return toHexString(bytearray);
}

export function toHexString(byteArray) {
  return Array.prototype.map
    .call(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).toUpperCase().slice(-2);
    })
    .join("");
}

export function AsciiToHexPad(AsciiString, length) {
  let hex = (AsciiToHex(AsciiString) + "0".repeat(length*2)).slice(0, length*2);
  return hex;
};


export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeHex(value, sigDigits) {
  let hex = ("0".repeat(sigDigits) + value.toString(16).toUpperCase()).slice(
    -sigDigits
  );
  return hex;
}
export function hexToASCII(hexString) {
  let str = "";
  for (let n = 0; n < hexString.length; n += 2) {
    str += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
  }
  return str;
}

export function AsciiToHex(str)
{
    let arr1 = [];
    for (let n = 0, l = str.length; n < l; n++)
    {
        let hex = Number(str.charCodeAt(n)).toString(16).toUpperCase();
        arr1.push(hex);
    }
    return arr1.join('');
};

export function hexToDecIPv4(hexString) {
  let str = "";
  for (let n = 0; n < hexString.length; n += 2) {
    str += parseInt(hexString.substr(n, 2), 16).toString();
    if (n < (hexString.length - 2)) str += ".";
  }
  return str;
}

export function hexToNumber(hexString) {
  return parseInt(hexString, 16);
}


export function hexToASCIInulltoNewLine(hexString) {
  let str = "";
  for (let n = 0; n < hexString.length; n += 2) {
    if(parseInt(hexString.substr(n, 2), 16)==0){
      str += '\n';
    }else
    {
      str += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
    }
  }
  return str;
}

export function hexToASCIIRemoveNull(hexString) {
  let str = "";
  for (let n = 0; n < hexString.length; n += 2) {
    if(parseInt(hexString.substr(n, 2), 16)!=0)
    {
      str += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
    }
  }
  return str;
};

export function MMSParser(hexdata) {
  let Msg = hexToBytes(hexdata);
  const MMSMessage = {
    MsgHeader: makeHex(Msg[0], 2),
    MsgVersion: makeHex(Msg[1], 2),
    MsgType: makeHex(Msg[4], 2),
    RefNum: makeHex(Msg[5], 2),
    RespID: makeHex((Msg[6] << 8) | Msg[7], 4),
    TLVData: toHexString(Msg.slice(8, Msg.length)),
    HexString: toHexString(Msg)
}
return MMSMessage;
}

export function newMMSParser(hexdata) {
  let Msg = hexToBytes(hexdata);
  const MMSMessage = {
    MsgHeader: makeHex(Msg[0], 2),
    MsgVersion: makeHex(Msg[1], 2),
    MsgType: makeHex(Msg[4], 2),
    RefNum: makeHex(Msg[5], 2),
    CmdID: makeHex((Msg[6] << 8) | Msg[7], 4),
    TLVData: toHexString(Msg.slice(8, Msg.length)),
    HexString: hexdata
}
return MMSMessage;
}


export function tlvParser(hexdata) {
  let data = hexToBytes(hexdata);
  const dataLength = data.length;
  const moreTagBytesFlag1 = 0x1f;
  const moreTagBytesFlag2 = 0x80;
  const constructedFlag = 0x20;
  const moreLengthFlag = 0x80;
  const oneByteLengthMask = 0x7f;

  let result = [];
  let iTLV = 0;
  let iTag;
  let bTag = true;
  let byteValue;
  let lengthValue;
  let tagBytes = null;
  let TagBuffer = [];

  while (iTLV < dataLength) {
    byteValue = data[iTLV];

    if (bTag) {
      iTag = 0;
      let bMoreTagBytes = true;

      if (byteValue === 0) {
        //First byte of tag cannot be zero.
        break;
      }

      while (bMoreTagBytes && iTLV < dataLength) {
        byteValue = data[iTLV];
        iTLV++;
        TagBuffer[iTag] = byteValue;
        bMoreTagBytes =
          iTag === 0
            ? (byteValue & moreTagBytesFlag1) == moreTagBytesFlag1
            : (byteValue & moreTagBytesFlag2) == moreTagBytesFlag2;
        iTag++;
      }
      tagBytes = toHexString(TagBuffer.slice(0, iTag));
      bTag = false;
    } else {
      lengthValue = 0;
      if ((byteValue & moreLengthFlag) == moreLengthFlag) {
        let nLengthBytes = byteValue & oneByteLengthMask;
        iTLV++;
        let iLen = 0;
        while (iLen < nLengthBytes && iTLV < dataLength) {
          byteValue = data[iTLV];
          iTLV++;
          lengthValue = ((lengthValue & 0x000000ff) << 8) + byteValue;
          iLen++;
        }
      } else {
        lengthValue = byteValue & oneByteLengthMask;
        iTLV++;
      }

      if (tagBytes) {
        let tagByte = TagBuffer[0];
        let endIndex =
          iTLV + lengthValue > dataLength ? dataLength : iTLV + lengthValue;
        let len = endIndex - iTLV;
        let valueBytes = len > 0 ? toHexString(data.slice(iTLV, iTLV + len)) : "";
        result.push({
          tag: tagBytes,
          tagLength: !lengthValue ? valueBytes.length + 1 / 2 : lengthValue,
          tagValue: valueBytes,
        });
        
        if (!((tagByte & constructedFlag) == constructedFlag)) {
          iTLV += lengthValue;
        }
        // else
        // {
        //   iTLV += lengthValue;
        // }
      }
      bTag = true;
    }
  }
  return result;
}

export function getTagValue(tagName, defaultTagValue, tlvData, asASCII) {
  try 
  {
    let TLVS = tlvParser(tlvData);
    let currtlv = TLVS.find((tlv) => tlv.tag === tagName);
    if (currtlv == undefined) return defaultTagValue;
    {
      if (asASCII == true) {
        return hexToASCIIRemoveNull(currtlv.tagValue);
      } 
      else 
      {
        return currtlv.tagValue;
      }
    }
  } 
  catch (error) {
    return defaultTagValue;
  }
  
}

export function sanitizeHexData(hexdata) {
  // Regular expression to match only hexadecimal characters
  const hexOnlyRegex = /[^0-9a-fA-F]/g;
  // Remove all non-hexadecimal characters
  return hexdata.replace(hexOnlyRegex, "");
}


export function removeSpaces(str) {
  return str.replace(/\s+/g, "");
}

export function hexToBytes(hex) {
  let bytes = [];
  for (let i = 0; i < hex.length; i += 2)
    bytes.push(parseInt(hex.substring(i, i+2), 16));
  return bytes;
}

export function debugLog(data) {
  console.log(`DebugLog: ${data}`);
}

export function getDefaultValue(key, defaultValue){
  let keyVal = localStorage.getItem(key);
  if (keyVal == null) keyVal = defaultValue;
 
  return keyVal;
}

export function saveDefaultValue(key, value){
  localStorage.setItem(key, value);    
}

export function getEncodedValue(key, defaultValue, isEncoded = true){
  let keyVal = localStorage.getItem(`enc-${window.btoa(key)}`);
  if (keyVal == null){
    keyVal = defaultValue;
    if(!isEncoded)
    {
      return keyVal;    
    }
  } 
  return window.atob(keyVal);
}

export function saveEncodedValue(key, value){
  localStorage.setItem(`enc-${window.btoa(key)}`, window.btoa(value));
}
export function EncodeValue(value)
{
  return window.btoa(value);
}
export function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export function filterString(inputString) {
	const filteredString = inputString.replace(/[^0-9A-Za-z]/g, '');
	return filteredString;
};



Array.prototype.zeroFill = function (len) {
  for (let i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};
   
   export async function waitForEvents(eventTarget, eventNames, strict) {
    
        // Default to document if no eventTarget is provided
        eventTarget = eventTarget || document;
    
        // Convert eventNames to an array if it's not already
        if (!Array.isArray(eventNames)) {
            eventNames = String(eventNames).split(',');
        }
    
        // Trim whitespace from event names
        eventNames = eventNames.map(function(eventName) {
            return String(eventName).trim();
        });
    
        // Throw an error if no valid event names are provided
        if (eventNames.length <= 0) {
            throw new Error('Invalid eventNames');
        }
    
        // Initialize an empty object to store the event objects
        let eventObjects = {};
    
        // Store the index of the last event that was fired
        let lastEventIndex = -1;
    
        // Create an array of promises, one for each event
        let listeners = eventNames.map(function(eventName, index) {
    
            // Return a promise that resolves once event fired
            return new Promise(function(resolve) {
    
                // Define event handler inside promise
                function waitForEventHandler(e) {
    
                    // In strict mode, only resolve the promise when events are fired in order
                    if (strict && index !== lastEventIndex + 1) {
                        // If not in order, store the event but don't resolve the promise
                        eventObjects[e.type] = e;
                    } else {
                        // Remove the event listener once the event has fired
                        eventTarget.removeEventListener(eventName, waitForEventHandler);
    
                        // Store the event object in the eventObjects
                        eventObjects[e.type] = e;
    
                        // Update the index of the last fired event
                        lastEventIndex = index;
    
                        // Resolve the promise
                        resolve();
                    }
                }
    
                // Add the event listener
                eventTarget.addEventListener(eventName, waitForEventHandler, false);
            });
        });
    
        // Return a promise that resolves when all events have fired
        return Promise.all(listeners).then(function() {
    
            // Return event objects in the order they were added
            return eventNames.map(function(name) {
                return eventObjects[name];
            });
        });
    }



    

    export function newtlvParse(hexdata) {
      let data = hexToBytes(hexdata);
      const dataLength = data.length;
      const moreTagBytesFlag1 = 0x1f;
      const moreTagBytesFlag2 = 0x80;
      const constructedFlag = 0x20;
      const moreLengthFlag = 0x80;
      const oneByteLengthMask = 0x7f;
    
      let result = [];
      let iTLV = 0;
      let iTag;
      let bTag = true;
      let byteValue;
      let lengthValue;
      let tagBytes = null;
      let TagBuffer = [];
    
      while (iTLV < dataLength) {
        byteValue = data[iTLV];
    
        if (bTag) {
          iTag = 0;
          let bMoreTagBytes = true;
    
          if (byteValue === 0) {
            //First byte of tag cannot be zero.
            break;
          }
    
          while (bMoreTagBytes && iTLV < dataLength) {
            byteValue = data[iTLV];
            iTLV++;
            TagBuffer[iTag] = byteValue;
            bMoreTagBytes =
              iTag === 0
                ? (byteValue & moreTagBytesFlag1) == moreTagBytesFlag1
                : (byteValue & moreTagBytesFlag2) == moreTagBytesFlag2;
            iTag++;
          }
          tagBytes = toHexString(TagBuffer.slice(0, iTag));
          bTag = false;
        } else {
          lengthValue = 0;
          if ((byteValue & moreLengthFlag) == moreLengthFlag) {
            let nLengthBytes = byteValue & oneByteLengthMask;
            iTLV++;
            let iLen = 0;
            while (iLen < nLengthBytes && iTLV < dataLength) {
              byteValue = data[iTLV];
              iTLV++;
              lengthValue = ((lengthValue & 0x000000ff) << 8) + byteValue;
              iLen++;
            }
          } else {
            lengthValue = byteValue & oneByteLengthMask;
            iTLV++;
          }
    
          if (tagBytes) {
            let tagByte = TagBuffer[0];
            let endIndex =
              iTLV + lengthValue > dataLength ? dataLength : iTLV + lengthValue;
            let len = endIndex - iTLV;
            let valueBytes = len > 0 ? toHexString(data.slice(iTLV, iTLV + len)) : "";
            result.push({
              tag: tagBytes,
              tagLength: !lengthValue ? valueBytes.length + 1 / 2 : lengthValue,
              tagValue: valueBytes,
            });
            
            if (!((tagByte & constructedFlag) == constructedFlag)) {
              iTLV += lengthValue;
            }
            else
            {
                iTLV += lengthValue;
            }
          }
          bTag = true;
        }
      }
      return result;
    }

    export function getObjectKeyLen(obj){
      try 
      {
        return Object.keys(obj).length  
      } catch (error) 
      {
        return 0;
      }
      
    }

    export async function sha256(data, asHex = false) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      if(asHex) return toHexString(hashArray);
      return hashArray;
    }
    
    export function getFileExtension(filename) {
      if (typeof filename !== 'string' || filename.lastIndexOf('.') === -1) {
        return ""; // Handle cases with no extension or invalid input
      }
      return filename.slice(filename.lastIndexOf('.') + 1);
    }
    

    export async function FetchCommandsfromURL(commandURL){
      let response = undefined;
      let json;
      try 
      {
        
        
        response = await fetch(commandURL);
        if (response.status == 200){
          json = await response.json();
        }

        
        let resp = {
          status: {
            ok: response.ok,
            text: response.statusText,
            code: response.status,
          },
          data: json
        }
        return resp;
      } 
      catch (error) {
        return error;
      }
      
    }
    