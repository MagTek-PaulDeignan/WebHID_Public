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

async function handleDOMLoaded() {
  let item = document.getElementById("txAPIKey");
  item.value = mt_Utils.getDefaultValue("APIKey", "MTPublic-AEECD44A-8755-4AA0-AD58-53C33FBBB4A8");

  item = document.getElementById("txProfileName");
  item.value = mt_Utils.getDefaultValue("ProfileName", "MagTek_Production");

  item = document.getElementById("txURL");
  item.value = mt_Utils.getDefaultValue("baseURL", "https://rms.magensa.net/ReaderSupport/FirmwareUpdate-v2/api");

  item = document.getElementById("txWSAddress");
  item.value = mt_Utils.getDefaultValue("txWSAddress", "ws://192.168.1.200");
   
}
async function handleSaveButton() {
  let item = document.getElementById("txAPIKey");
  mt_Utils.saveDefaultValue("APIKey", item.value);

  item = document.getElementById("txProfileName");
  mt_Utils.saveDefaultValue("ProfileName", item.value);

  item = document.getElementById("txURL");
  mt_Utils.saveDefaultValue("baseURL", item.value);

  item = document.getElementById("txWSAddress");
  mt_Utils.saveDefaultValue("txWSAddress", item.value);
 
  item = document.getElementById("status");
  item.innerText = "Saved"
  //alert("Saved");
}
