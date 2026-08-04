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

export function updateProgressBar(caption, progress) {
  try 
  {
    const updDeviceContainer = document.getElementById("updDeviceContainer");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
  
    if (progressBar != null)
    {
      if (progress < 0) 
      {
        updDeviceContainer.style.visibility = "hidden";
        progressContainer.style.visibility = "hidden";
        progressBar.style.visibility = "hidden";
      } 
      else 
      {
        updDeviceContainer.style.visibility = "visible";
        progressContainer.style.visibility = "visible";
        progressBar.style.visibility = "visible";
        updDeviceContainer.getElementsByTagName("P")[0].textContent = caption;
        progressBar.ariaValueNow = progress;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${caption} ${progress}%`;
      }  
    }
  } 
  catch (error) 
  {
    
  }
  
};

export function LogData(data) {

  try {
    const log = document.getElementById("LogData");
    log.value += data + "\n";
    log.scrollTop = log.scrollHeight;    
  } catch (error) {
    
  }

};

export function ClearLog() {
try 
{
  const log = document.getElementById("LogData");
    log.value = "";
    updateProgressBar("",-1);  
} catch (error) 
{
  
}
  }
  
export function UpdateValue(id, value ) {
    try {
      document.getElementById(id).value = value;
    } catch (error) {
      
    }
  }

export function GetValue(id ) {
    try {
      const element= document.getElementById(id);
      return element.value;  
    } catch (error) {
      return null;  
    }
  }
  
export function FromListToText(event) {
    document.getElementById("sendData").value = event.target.value;
}
  
  export function setUSBConnected(value) {
    const item = document.getElementById("USBStatus");
    const label = document.getElementById("lblUSBStatus");
    label.innerText = value;
    
    switch (value.toLowerCase()) {
      case "opened":
        item.src = "./images/usb-opened.png";
        break;
      case "closed":
        item.src = "./images/usb-closed.png";
        label.value = ""
        break;
      case "connected":
        item.src = "./images/usb-connected.png";
        break;
      case "disconnected": 
        item.src = "./images/usb-disconnected.png"; 
        break;
      case "connect a device":
        item.src = ""; 
        break;
      case "detecting...":
          item.src = ""; 
          break;
      default:
        item.src = "./images/usb-disconnected.png";
        break;
    }
  };
  
   export function DeviceDisplay(value) {
     const item = document.getElementById("DeviceDisplay");
     if (value.length == 0){
       item.innerText =  "WELCOME";
     }
     else
     {
       item.innerText = value;
     }
   };


 export function AddDeviceLink(type, name, status, url ){
    let bShowOffline = false;
    
    let isChecked = mt_Utils.getEncodedValue("ShowOffline", "ZmFsc2U=");
   (isChecked === "true" ? bShowOffline = true: bShowOffline = false);
  
    //console.log(status);
    const imgOnline = document.createElement('img');
    imgOnline.setAttribute('src', `./images/${status}.png`);
    imgOnline.className = "thumbnail";
    imgOnline.setAttribute('height', '10px');
    imgOnline.setAttribute('width', '10px');

    const img = document.createElement('img');
    img.setAttribute('src', `./images/${type}.png`);
    img.className = "img-fluid img-thumbnail";
    img.setAttribute('height', '60px');
    img.setAttribute('width', '60px');
    
    const link = document.createElement('a');
    link.id = `dev-${type}${name}`;
    link.href = url;
    link.textContent = name;
    link.style.display = "inline-flex";
    link.prepend(imgOnline);    
    link.prepend(img);
    if (status == "disconnected"){
      link.hidden = !bShowOffline;
    }
    else
    {
      link.hidden = false;
    }
    const existingLink  = document.getElementById(`dev-${type}${name}`);
    if (existingLink == null){
      document.getElementById('device-links').appendChild(link);
    }else
    {
      existingLink.replaceWith(link);
    }
 }  

 export function UpdateQRCode(qrcode)
 {
  try 
  {
    document.getElementById(`QRCode`).src = `https://paoli.magensa.net/Test/RenderImage/Home/QRCode?QRData=${qrcode}`;
  } catch (error) { }
  }
 
  export function UpdateQRCodewithLink(qrcode)
  {
   try 
   {
     document.getElementById(`QRCode`).src = `https://paoli.magensa.net/Test/RenderImage/Home/QRCode?QRData=${qrcode}`;
     document.getElementById(`QRCodeLink`).href = `${qrcode}`;
     
   } catch (error) { }
   }
 
 const FORMATTERS = 
 {
  "ASCII": mt_Utils.hexToASCII,
  "Base64": mt_Utils.hexToBase64,  
  "Decimal": mt_Utils.hexToNumberString,
  "Hex": null,
  "CheckMark": hexToCheck,
  "Boolean": hexToBoolString
 };

function hexToCheck(hexString) {
  if(hexString == "01") return "&#9989;";
  else return "&#10060;"
}
function hexToBoolString(hexString) {
    if(hexString == "01") return "True";
  else return "False"
}


const MDoc_TAG_CONFIG = {
  "DFDF59": { desc: "Encrypted Payload", format: "Hex" },
  "9F01": { desc: "Family Name", format: "ASCII" },
  "9F02": { desc: "Given Name", format: "ASCII" },
  "9F03": { desc: "Birth Date", format: "ASCII" },
  "9F04": { desc: "Issue Date", format: "ASCII" },
  "9F05": { desc: "Expiry Date", format: "ASCII" },
  "9F06": { desc: "Issuing Country", format: "ASCII" },
  "9F07": { desc: "Issuing Authority", format: "ASCII" },
  "9F08": { desc: "Document Number", format: "ASCII" },
  "9F09": { desc: "Portrait", format: "Base64" },
  "9F0A": { desc: "Driving Privileges", format: "ASCII" },
  "9F0B": { desc: "Undistinguishing Sign", format: "ASCII" },
  "9F0C": { desc: "Administrative Number", format: "Decimal" },
  "9F0D": { desc: "Sex", format: "ASCII" },
  "9F0E": { desc: "Height(cm)", format: "Decimal" },
  "9F0F": { desc: "Weight(kg)", format: "Decimal" },
  "9F10": { desc: "Eye Color", format: "ASCII" },
  "9F11": { desc: "Hair Color", format: "ASCII" },
  "9F12": { desc: "Birth Place", format: "ASCII" },
  "9F13": { desc: "Resident Address", format: "ASCII" },
  "9F14": { desc: "Portrait Capture Date", format: "ASCII" },
  "9F15": { desc: "Age in years", format: "Decimal" },
  "9F16": { desc: "Age birth year", format: "Decimal" },
  "9F17": { desc: "Age over 18", format: "CheckMark" },
  "9F18": { desc: "Age over 21", format: "CheckMark" },
  "9F19": { desc: "Age over 25", format: "CheckMark" },
  "9F1A": { desc: "Issuing Jurisdiction", format: "ASCII" },
  "9F1B": { desc: "Nationality", format: "ASCII" },    
  "9F1C": { desc: "Resident City", format: "ASCII" },    
  "9F1D": { desc: "Resident State", format: "ASCII" },    
  "9F1E": { desc: "Resident Postal Code", format: "ASCII" },    
  "9F1F": { desc: "Resident Country", format: "ASCII" },    
  "9F01":{ desc:  "Family Name", format: "ASCII" },
  "9F20":{ desc:  "Biometric Template xx", format: "ASCII" },
  "9F21":{ desc:  "Family name national character", format: "ASCII" },
  "9F22":{ desc:  "Given name national character", format: "ASCII" },
  "9F23":{ desc:  "Signature usual mark", format: "ASCII" },
  // AAM{ desc: VA supplemental (DF74 / mDL namespace, format: "ASCII" },
  "9F41":{ desc:  "domestic_driving_privileges", format: "ASCII" },
  "9F42":{ desc:  "name_suffix", format: "ASCII" },
  "9F43":{ desc:  "organ_donor", format: "ASCII" },
  "9F44":{ desc:  "veteran", format: "ASCII" },
  "9F45":{ desc:  "family_name_truncation", format: "ASCII" },
  "9F46":{ desc:  "given_name_truncation", format: "ASCII" },
  "9F47":{ desc:  "aka_family_name.v2", format: "ASCII" },
  "9F48":{ desc:  "aka_given_name.v2", format: "ASCII" },
  "9F49":{ desc:  "aka_suffix", format: "ASCII" },
  "9F4A":{ desc:  "weight_range", format: "ASCII" },
  "9F4B":{ desc:  "race_ethnicity", format: "ASCII" },
  "9F4C":{ desc:  "sex (AAMVA supplemental)", format: "ASCII" },
  "9F4D":{ desc:  "first_name", format: "ASCII" },
  "9F4E":{ desc:  "middle_names", format: "ASCII" },
  "9F4F":{ desc:  "first_name_truncation", format: "ASCII" },
  "9F50":{ desc:  "middle_names_truncation", format: "ASCII" },
  "9F51":{ desc:  "EDL_credential", format: "ASCII" },
  "9F52":{ desc:  "EDL_credential.v2", format: "ASCII" },
  "9F53":{ desc:  "DHS_compliance", format: "ASCII" },
  "9F54":{ desc:  "resident_county", format: "ASCII" },
  "9F55":{ desc:  "resident_county.v2", format: "ASCII" },
  "9F56":{ desc:  "hazmat_endorsement_expiration_date", format: "ASCII" },
  "9F57":{ desc:  "CDL_indicator", format: "ASCII" },
  "9F58":{ desc:  "CDL_non_domiciled", format: "ASCII" },
  "9F59":{ desc:  "CDL_non_domiciled.v2", format: "ASCII" },
  "9F5A":{ desc:  "DHS_compliance_text", format: "ASCII" },
  "9F5B":{ desc:  "DHS_temporary_lawful_status", format: "ASCII" },

  "9F61":{ desc:  "Family Name", format: "ASCII" },
  "9F62":{ desc:  "Given Name", format: "ASCII" },
  "9F63":{ desc:  "Family Name", format: "ASCII" },
  "9F64":{ desc:  "Given Name", format: "ASCII" },
  "9F65":{ desc:  "Birth Date", format: "ASCII" },
  "9F66":{ desc:  "Portrait", format: "Hex" },
  "9F67":{ desc:  "Issue Date", format: "ASCII" },
  "9F68":{ desc:  "Expiry Date", format: "ASCII" },
  "9F69":{ desc:  "Issuing Authority Unicode", format: "ASCII" },
  "9F6A":{ desc:  "Issuing Country", format: "ASCII" },
  "9F6B":{ desc:  "Age In Years", format: "Decimal" },
  "9F6C":{ desc:  "Age Over 18", format: "Boolean" },
  "9F6D":{ desc:  "Age Over 21", format: "Boolean" },
  "9F6E":{ desc:  "Age Over 25", format: "Boolean" },
  "9F6F":{ desc:  "Age Birth Year", format: "Decimal" },
  "9F70":{ desc:  "Sex", format: "Hex" },
  "9F71":{ desc:  "Nationality", format: "ASCII" },
  "9F72":{ desc:  "Document Number", format: "ASCII" },
  "9F73":{ desc:  "Issuing Authority Latin1", format: "ASCII" },
  "9F74":{ desc:  "Portrait Capture Date", format: "ASCII" }
};


  function formatTLVElement(element) {
  const { tag, tagValue } = element;
  
  // Get config for the tag (fallback to defaults if the tag isn't known)
  const config = MDoc_TAG_CONFIG[tag] || { desc: "Unknown Tag", format: "Hex" };
  
  // Dynamically fetch the correct formatting function from our map
  const formatterFn = FORMATTERS[config.format];
  
  // Format the value if a valid formatter exists, otherwise keep raw hex
  const formattedValue = formatterFn ? formatterFn(tagValue) : tagValue;
  
  // Return a beautiful, informative log string
  return `${config.desc} [${tag}]: ${formattedValue}`;
}

   export function PrintTLVs(TLVs){
    LogData("TLVs---------------------------------");
    TLVs.forEach(element => {
      //const logLine = formatTLVElement(element);
      //LogData(logLine);
      LogData(`${element.tag} : ${element.tagValue} `);    
    });   
    
    LogData("TLVs---------------------------------");
   }

   export function PrintFormattedTLVs(TLVs){
    LogData("                                                   ");
    LogData("mDoc Data Elements---------------------------------");
    
     const sortedTLVs = [...TLVs].sort((a, b) => {
         return String(a.tag).localeCompare(String(b.tag), undefined, { numeric: true });
     });
    //TLVs.forEach(element => {
      sortedTLVs.forEach(element => {
      switch (element.tag) {
        case "9F66":
          // Not Printing Portrait Data
          break;
        case "9F09":
          // Not Printing Portrait Data
          break;
        default:
          const logLine = formatTLVElement(element);
          LogData(`   ${logLine}`);      
          break;
      }
    });   
    LogData("mDoc Data Elements---------------------------------");
    LogData("                                                   ");
   }

   // Function to show the loading spinner
export function showSpinner() {
  const loadingSpinner = document.getElementById('loading-spinner');
  //loadingSpinner.style.display = 'block';
  loadingSpinner.style.visibility = "visible";
}

// Function to hide the loading spinner
export function hideSpinner() {
  const loadingSpinner = document.getElementById('loading-spinner');
  //loadingSpinner.style.display = 'none';
  loadingSpinner.style.visibility = "hidden";
}

export function CheckForDevice(device){
switch (device.toLowerCase()) 
{
  case "mms_hid":
    CheckForHID();
    break;
  case "mms_ble":
    CheckForBLE();
    break;
  case "mms_serial":
    CheckForSerial();  
    break;
  case "mms_mqtt":    
    break;
  case "mms_wss":    
    break;
  default:
    LogData(`Unknown device: ${device}`);
    break;
}
}

export function CheckForHID(){
  if (!navigator.hid)
  {
    LogData("This Browser/OS does not support WEB HID");
    LogData("See: https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API#browser_compatibility");
  } 
}
export function CheckForSerial(){
  if (!navigator.serial)
  {
    LogData("This Browser/OS does not support WEB Serial");
    LogData("See: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility");
  } 
}
export function CheckForBLE(){
  if (!navigator.bluetooth)
  {
    LogData("This Browser/OS does not support WEB Bluetooth");
    LogData("See: https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility");
    if (isiOS()) LogData("   We recommend using Bluefy on your iOS device:  https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055");
  } 
}

function isiOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function StringNoNulls(data){
  let resp = JSON.stringify(data,(key, value) => {
  if (value !== null) return value
},2);
return resp;
}


/**
 * Types text into an element and logs performance metrics.
 * @param {string} text - The string to type.
 * @param {number} speed - Delay in ms between characters.
 */
 export async function simulateTyping(text, speed = 100) {
   const target = document.activeElement;
  
   if (!target || !('value' in target)) {
     console.error("No editable input focused!");
     return;
   }

   const startTime = performance.now(); // Start high-res timer
   const delay = (ms) => new Promise(res => setTimeout(res, ms));

   for (const char of text) {
//     // 1. Dispatch KeyDown
     target.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));

//     // 2. Update Value & Cursor
     const start = target.selectionStart;
     const end = target.selectionEnd;
     target.value = target.value.slice(0, start) + char + target.value.slice(end);
     target.selectionStart = target.selectionEnd = start + 1;

//     // 3. Dispatch Input
     target.dispatchEvent(new Event('input', { bubbles: true }));

//     // 4. Dispatch KeyUp
     target.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));

     await delay(speed);
   }

   const endTime = performance.now(); // End high-res timer
  
//   // --- Metrics Calculation ---
   const totalTimeMs = endTime - startTime;
   const totalTimeSeconds = totalTimeMs / 1000;
   const charsPerSecond = text.length / totalTimeSeconds;

   console.log(`--- Typing Simulation Metrics ---`);
   console.log(`Total Characters: ${text.length}`);
   console.log(`Total Time:       ${totalTimeMs.toFixed(2)} ms`);
   console.log(`Effective CPS:    ${charsPerSecond.toFixed(2)} chars/sec`);
   console.log(`---------------------------------`);

   target.dispatchEvent(new Event('change', { bubbles: true }));
 }
