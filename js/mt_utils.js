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

export function toHexString(byteArray) {
  return Array.prototype.map
    .call(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).toUpperCase().slice(-2);
    })
    .join("");
}

export function AsciiToHexPad(AsciiString, length) {
  var hex = (AsciiToHex(AsciiString) + "0".repeat(length*2)).slice(0, length*2);
  return hex;
};


export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeHex(value, sigDigits) {
  var hex = ("0".repeat(sigDigits) + value.toString(16).toUpperCase()).slice(
    -sigDigits
  );
  return hex;
}
export function hexToASCII(hexString) {
  var str = "";
  for (var n = 0; n < hexString.length; n += 2) {
    str += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
  }
  return str;
}

export function AsciiToHex(str)
{
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++)
    {
        var hex = Number(str.charCodeAt(n)).toString(16).toUpperCase();
        arr1.push(hex);
    }
    return arr1.join('');
};

export function hexToDecIPv4(hexString) {
  var str = "";
  for (var n = 0; n < hexString.length; n += 2) {
    str += parseInt(hexString.substr(n, 2), 16).toString();
    if (n < (hexString.length - 2)) str += ".";
  }
  return str;
}


export function hexToASCIInulltoNewLine(hexString) {
  var str = "";
  for (var n = 0; n < hexString.length; n += 2) {
    if(parseInt(hexString.substr(n, 2), 16)==0){
      str += '\n';
    }else
    {
      str += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
    }
  }
  return str;
}

function hexToASCIIRemoveNull(hexString) {
  var str = "";
  for (var n = 0; n < hexString.length; n += 2) {
    if(parseInt(hexString.substr(n, 2), 16)!=0)
    {
      str += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
    }
  }
  return str;
};


export function tlvParser(hexdata) {
  var data = hexToBytes(hexdata);
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
        let valueBytes =
          len > 0 ? toHexString(data.slice(iTLV, iTLV + len)) : "";
        result.push({
          tag: tagBytes,
          tagLength: !lengthValue ? valueBytes.length + 1 / 2 : lengthValue,
          tagValue: valueBytes,
        });
        if (!((tagByte & constructedFlag) == constructedFlag)) {
          iTLV += lengthValue;
        }
      }
      bTag = true;
    }
  }
  return result;
}

export function getTagValue(tagName, defaultTagValue, tlvData, asASCII) {
  try {
    var TLVS = tlvParser(tlvData);
    var currtlv = TLVS.find((tlv) => tlv.tag === tagName);
    if (currtlv != null) {
      if (asASCII == true) {
        return hexToASCIIRemoveNull(currtlv.tagValue);
      } else {
        return currtlv.tagValue;
      }
    }
  } catch (error) {
    
    return defaultTagValue;
  }
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
  // console.log(`DebugLog: ${data}`);
}

export function getDefaultValue(key, defaultValue){
  var keyVal = localStorage.getItem(key);
  if (keyVal == null) keyVal = defaultValue;
  return keyVal;
}

export function saveDefaultValue(key, value){
  localStorage.setItem(key, value);    
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


Array.prototype.zeroFill = function (len) {
  for (var i = this.length; i < len; i++) {
    this[i] = 0;
  }
  return this;
};
