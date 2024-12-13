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
let ShowOffline = "false";

async function handleDOMLoaded() {
  let item = document.getElementById("txAPIKey");
  item.value = mt_Utils.getEncodedValue("APIKey", "TVRQdWJsaWMtQUVFQ0Q0NEEtODc1NS00QUEwLUFENTgtNTNDMzNGQkJCNEE4");
  

  item = document.getElementById("txProfileName");
  item.value = mt_Utils.getEncodedValue("ProfileName", "TWFnVGVrX1Byb2R1Y3Rpb24=");
  

  item = document.getElementById("txURL");
  item.value = mt_Utils.getEncodedValue("baseURL", "aHR0cHM6Ly9ybXMubWFnZW5zYS5uZXQvUmVhZGVyU3VwcG9ydC9GaXJtd2FyZVVwZGF0ZS12Mi9hcGk=");

  item = document.getElementById("txVersion");
  item.value = mt_Utils.getEncodedValue("RMSVersion", "");


  item = document.getElementById("txWSAddress");
  item.value = mt_Utils.getEncodedValue("WSAddress", "d3M6Ly8xOTIuMTY4LjEuMjAw");
  
  item = document.getElementById("txMQTTURL");
  item.value = mt_Utils.getEncodedValue("MQTTURL", "d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==");

  item = document.getElementById("txMQTTDevice");
  item.value = mt_Utils.getEncodedValue("MQTTDevice", "");

  item = document.getElementById("txMQTTUser");
  item.value = mt_Utils.getEncodedValue("MQTTUser", "RGVtb0NsaWVudA==");
  
  item = document.getElementById("txMQTTPassword");
  item.value = mt_Utils.getEncodedValue("MQTTPassword", "ZDNtMENMdjFjMQ==");

  item = document.getElementById("txContactlessDelay");
  item.value = mt_Utils.getEncodedValue("ContactlessDelay", "NTAw");
  
  
  ShowOffline = mt_Utils.getEncodedValue("ShowOffline", "ZmFsc2U=");
  item = document.getElementById("chk-ShowOffline");
  (ShowOffline === "true" ? item.checked = true : item.checked = false);
  
}

async function handleBackButton() {
    window.location.href = "index.html";  
}

async function handleSaveButton() {
  let item = document.getElementById("txAPIKey");  
  mt_Utils.saveEncodedValue("APIKey", item.value);

  item = document.getElementById("txProfileName");
  mt_Utils.saveEncodedValue("ProfileName", item.value);

  item = document.getElementById("txURL");
  mt_Utils.saveEncodedValue("baseURL", item.value);
  
  item = document.getElementById("txVersion");
  mt_Utils.saveEncodedValue("RMSVersion", item.value);

  item = document.getElementById("txWSAddress");
  mt_Utils.saveEncodedValue("WSAddress", item.value);

  item = document.getElementById("txMQTTURL");
  mt_Utils.saveEncodedValue("MQTTURL", item.value);

  item = document.getElementById("txMQTTDevice");
  mt_Utils.saveEncodedValue("MQTTDevice", item.value);

  item = document.getElementById("txMQTTUser");
  mt_Utils.saveEncodedValue("MQTTUser", item.value);

  item = document.getElementById("txMQTTPassword");
  mt_Utils.saveEncodedValue("MQTTPassword", item.value);

  item = document.getElementById("txContactlessDelay");
  mt_Utils.saveEncodedValue("ContactlessDelay", item.value);

  item = document.getElementById("chk-ShowOffline");
  item.checked ? ShowOffline = "true" : ShowOffline = "false";
  mt_Utils.saveEncodedValue("ShowOffline", ShowOffline );

  item = document.getElementById("status");
  item.innerText = " : Saved"  
  window.location.href = "index.html";
}
