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
export function updateProgressBar(caption, progress) {
  const updDeviceContainer = document.getElementById("updDeviceContainer");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");

  if (progress < 0) {
    updDeviceContainer.style.visibility = "hidden";
    progressContainer.style.visibility = "hidden";
    progressBar.style.visibility = "hidden";
  } else {
    updDeviceContainer.style.visibility = "visible";
    progressContainer.style.visibility = "visible";
    progressBar.style.visibility = "visible";
    updDeviceContainer.getElementsByTagName("P")[0].textContent = caption;
    progressBar.ariaValueNow = progress;
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${caption} ${progress}%`;
  }
};

export function LogData(data) {
  const log = document.getElementById("LogData");
  log.value += data + "\n";
  log.scrollTop = log.scrollHeight;
};

export function ClearLog() {
    const log = document.getElementById("LogData");
    log.value = "";
    updateProgressBar("",-1);
  }
  
 
export function FromListToText() {
    const val = document.getElementById("CommandList").value;
    const item = document.getElementById("sendData");
    item.value = val;
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
  