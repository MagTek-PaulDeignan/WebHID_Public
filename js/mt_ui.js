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

export function updateProgressBar(caption, progress) {
  try 
  {
    const updDeviceContainer = document.getElementById("updDeviceContainer");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
  
    if (progress < 0) {
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
    var bShowOffline = false;
    
    let isChecked = mt_Utils.getDefaultValue("ShowOffline", "false");
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
    link.id = `dev-${name}`;
    link.href = url;
    link.textContent = name;
    //link.target = "_blank"; // Opens link in a new tab
    link.style.display = "inline-flex";
    link.prepend(imgOnline);    
    link.prepend(img);
    if (status == "disconnected"){
      //link.hidden = true;
      link.hidden = !bShowOffline;
    }
    else
    {
      link.hidden = false;
    }
    const existingLink  = document.getElementById(`dev-${name}`);
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
  } catch (error) 
  {
    
  }
  }
 