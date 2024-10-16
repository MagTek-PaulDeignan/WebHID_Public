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
  let item = document.getElementById("txUserName");
  item.value = mt_Utils.getDefaultValue("MPPG_UserName", "TSYSPilotPROD");

  item = document.getElementById("txPassword");
  item.value = mt_Utils.getDefaultValue("MPPG_Password", "Password#12345");

  item = document.getElementById("txCustCode");
  item.value = mt_Utils.getDefaultValue("MPPG_CustCode", "KT44746264");

  item = document.getElementById("txProcessorName");
  item.value = mt_Utils.getDefaultValue("MPPG_ProcessorName", "TSYS - PILOT");
  
}

async function handleBackButton() {
    window.location.href = "index.html";  
}

async function handleSaveButton() {
  let item = document.getElementById("txUserName");
  mt_Utils.saveDefaultValue("MPPG_UserName", item.value);

  item = document.getElementById("txPassword");
  mt_Utils.saveDefaultValue("MPPG_Password", item.value);

  item = document.getElementById("txCustCode");
  mt_Utils.saveDefaultValue("MPPG_CustCode", item.value);

  item = document.getElementById("txProcessorName");
  mt_Utils.saveDefaultValue("MPPG_ProcessorName", item.value);

  item = document.getElementById("status");
  item.innerText = " :Saved"  
  window.location.href = "index.html";
}
