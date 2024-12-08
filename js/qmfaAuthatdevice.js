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

var TokenID;

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


document.addEventListener("DOMContentLoaded", handleDOMLoaded);




async function handleDOMLoaded() {

var resp = await mt_QMFA.TransactionRead(TokenID);
 mt_UI.LogData(JSON.stringify(resp, null, 2));


}

async function handleApprove(){
  
 var Token = 
 {
   Header: "QMFAToken",
   ID: TokenID,
   Status: true,
   Reason:"Approved"
 }
 
 mt_UI.LogData("Present this QRCode to the POS");
 mt_UI.LogData("To APPROVE this transaction");
 mt_UI.UpdateQRCode(JSON.stringify(Token));

}
async function handleDecline(){
  var Token = 
  {
    Header: "QMFAToken",
    ID: TokenID,
    Status: false,
    Reason:"Declined"
  }  
  mt_UI.LogData("Present this QRCode to the POS");
  mt_UI.LogData("To DECLINE this transaction");
  mt_UI.UpdateQRCode(JSON.stringify(Token));
}

