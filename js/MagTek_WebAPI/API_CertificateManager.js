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

export let BaseURL = "";
export let WebAPIKey = "";
export let Profile = "";

/**
 * @param {string} url
 */
export function setURL(url) {
  BaseURL = url;
}
/**
 * @param {string} key
 */
export function setWebAPIKey(key) {
  WebAPIKey = key;
}
/**
 * @param {string} profile
 */
export function setProfile(profile) {
  Profile = profile;
}

export async function SignCSR(firmwareID, csr, expInt, expUnits = "Days") {
    try {
       
      let req = {
        firmwareID: firmwareID,
        csr: csr,
        expires: {
            value: expInt,
            interval: expUnits
        },
        outputPEMFile: false,
        outputSignedFile: false,
        outputLoadCommands: true
    }  
      let TransactionResponse = await PostCSRSign(req);
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };

  export async function VerifyCertificate(firmwareID, pemCertificate) {
    try {
      let req = {
        firmwareID: firmwareID,
        certificate: pemCertificate,
        outputPEMFile: false,
        outputSignedFile: false,
        outputLoadCommands: false
    }
      let TransactionResponse = await PostCertificateVerify(req);    
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };


  export async function LoadCommands(firmwareID, name) {
    try {
       
      let req = {
        firmwareID: firmwareID,
        name: name
      }  
      let TransactionResponse = await PostLoadCommands(req);
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };

  async function PostCSRSign(request) {
    const url = BaseURL + "/api/CertificateManager/CSR/Sign";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }
  async function PostLoadCommands(request) {
    const url = BaseURL + "/api/CertificateManager/Configuration/LoadCommands";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }

  async function PostCertificateVerify(request) {
    const url = BaseURL + "/api/CertificateManager/Certificate/Verify";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }
  
  async function postRequest(url, data) {
    try 
    {
      let response = undefined;
      let json;

       response = await fetch(url, {
        method: "POST",
        body: data,
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
          "QwantumProfile": Profile,
          "QwantumAPIKey" : WebAPIKey
        }),
      });
      
      if (response.status == 200){
        json = await response.json();
      }

      let resp = {
        status: {
          ok: response.ok,
          text: response.statusText,
          code: response.status,
        },
        data: json
      }
      return resp;
    } 
    catch (error) 
    {
      return error;
    }
  }