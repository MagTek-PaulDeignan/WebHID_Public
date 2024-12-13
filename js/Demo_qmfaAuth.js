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
import * as mt_UI from "./mt_ui.js";
import * as mt_QMFA from "./qMFAAPI.js";

import "./mt_events.js";

let TokenID = null;

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.TokenID;
if (value != null) {
  TokenID = value;
}


document
.querySelector("#TransApprove")
.addEventListener("click", handleApprove);

document
.querySelector("#TransDecline")
.addEventListener("click", handleDecline);

document
.querySelector("#TransLookup")
.addEventListener("click", handleLookup);



document.addEventListener("DOMContentLoaded", handleDOMLoaded);


async function handleLookup() {
  TokenID = document.getElementById(`TransLookupID`).value;
  let resp = await mt_QMFA.TransactionRead(TokenID);
  mt_UI.LogData(JSON.stringify(resp, null, 2)); 

}



async function handleDOMLoaded() {

if (TokenID != null)
{
  let resp = await mt_QMFA.TransactionRead(TokenID);
  mt_UI.LogData(JSON.stringify(resp, null, 2));
  document.getElementById(`TransLookup`).hidden = true;
  document.getElementById(`TransLookupID`).hidden = true;
  document.getElementById(`TransApprove`).hidden = false;
  document.getElementById(`TransDecline`).hidden = false;

}
else
{
  document.getElementById(`TransLookup`).hidden = false;
  document.getElementById(`TransLookupID`).hidden = false;
  document.getElementById(`TransApprove`).hidden = true;
  document.getElementById(`TransDecline`).hidden = true;

}

}

async function handleApprove(){
  let resp = await mt_QMFA.TransactionRedeem(TokenID,"True","Approved");
  mt_UI.LogData(JSON.stringify(resp, null, 2)); 
}
async function handleDecline(){
  let resp = await mt_QMFA.TransactionRedeem(TokenID,"False","Declined");
  mt_UI.LogData(JSON.stringify(resp, null, 2));  
}

