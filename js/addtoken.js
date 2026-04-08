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
"use strict";


const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let un = params.un ?? "";
let sc = params.sc ?? "";
let td = params.td ?? "";
let tu = params.tu ?? "";
let ti = params.ti ?? "";
let rl = params.rl ?? "";
let ru = params.ru ?? "";




document.addEventListener("DOMContentLoaded", handleDOMLoaded);
document.querySelector("#addToken").addEventListener("click", addToken);


async function handleDOMLoaded() {
    document.getElementById('tokenUse').innerText = tu;
    document.getElementById('banner-image-display').src = ti;

    let qrData = `qmfa%3A%2F%2Frms.magensa.net%2FQwantum%2FQMFA%2FAddAccount?un=${un}%26sc=${sc}%26td=${td}%26tu=${tu}%26ti=${ti}&rl=${rl}&ru=${ru}`;
    document.getElementById('barcode-image-display').src = `https://paoli.magensa.net/Test/RenderImage/Home/QRCode?QRData=${qrData}`;  
}


function addToken() {
   let qrData = `qmfa://rms.magensa.net/Qwantum/QMFA/AddAccount?un=${un}&sc=${sc}&td=${td}&tu=${tu}&ti=${ti}&rl=${rl}&ru=${ru}`;
   window.location.href = `${qrData}`;  
}