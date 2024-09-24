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

import * as mt_Utils from "./mt_utils.js";

document.addEventListener("DOMContentLoaded", handleDOMLoaded);
document.querySelector("#btnSave").addEventListener("click", handleSaveButton);
document.querySelector("#btnBack").addEventListener("click", handleBackButton);

async function handleDOMLoaded() {
  let item = document.getElementById("txAPIKey");
  item.value = mt_Utils.getDefaultValue("APIKey", "MTPublic-AEECD44A-8755-4AA0-AD58-53C33FBBB4A8");

  item = document.getElementById("txProfileName");
  item.value = mt_Utils.getDefaultValue("ProfileName", "MagTek_Production");

  item = document.getElementById("txURL");
  item.value = mt_Utils.getDefaultValue("baseURL", "https://rms.magensa.net/ReaderSupport/FirmwareUpdate-v2/api");

  item = document.getElementById("txWSAddress");
  item.value = mt_Utils.getDefaultValue("WSAddress", "ws://192.168.1.200");

  item = document.getElementById("txMQTTURL");
  item.value = mt_Utils.getDefaultValue("MQTTURL", "wss://hd513d49.ala.us-east-1.emqxsl.com:8084/mqtt");

  item = document.getElementById("txMQTTDevice");
  item.value = mt_Utils.getDefaultValue("MQTTDevice", "DynaFlex/B55F78E");

  item = document.getElementById("txMQTTUser");
  item.value = mt_Utils.getDefaultValue("MQTTUser", "testDevice1");

  item = document.getElementById("txMQTTPassword");
  item.value = mt_Utils.getDefaultValue("MQTTPassword", "t3stD3v1c1");
}

  
async function handleBackButton() {
    window.location.href = "index.html";  
}

async function handleSaveButton() {
  let item = document.getElementById("txAPIKey");
  mt_Utils.saveDefaultValue("APIKey", item.value);

  item = document.getElementById("txProfileName");
  mt_Utils.saveDefaultValue("ProfileName", item.value);

  item = document.getElementById("txURL");
  mt_Utils.saveDefaultValue("baseURL", item.value);

  item = document.getElementById("txWSAddress");
  mt_Utils.saveDefaultValue("WSAddress", item.value);

  item = document.getElementById("txMQTTURL");
  mt_Utils.saveDefaultValue("MQTTURL", item.value);

  item = document.getElementById("txMQTTDevice");
  mt_Utils.saveDefaultValue("MQTTDevice", item.value);

  item = document.getElementById("txMQTTUser");
  mt_Utils.saveDefaultValue("MQTTUser", item.value);

  item = document.getElementById("txMQTTPassword");
  mt_Utils.saveDefaultValue("MQTTPassword", item.value);

  item = document.getElementById("status");
  item.innerText = " :Saved"
  //alert("Saved");
  window.location.href = "index.html";

}
