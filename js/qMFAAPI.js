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

export let BaseURL = "https://rms.magensa.net/Qwantum/MFA-V2";

export let WebAPIKey = "MTSandbox-F0FA3140-1E50-4331-8BB9-F33BF9CB32FB";
export let Profile = "SandBox";

/**
 * @param {string} url
 */
export function setURL(url) {
  BaseURL = url;
}


export async function TransactionCreate( SMSNumber, EmailAddress, Claims ){
  
    try {
       
      var req = {
    
        InputParameters: {
          
          Template: "TransactionIDSendVerifyatDeviceTSYS",
          ExpirationSeconds:"600",
          EmailAddress: EmailAddress,
          SMSNumber: SMSNumber    
        },
        Claims: Claims      
      }

      
      var TransactionResponse = await PostCreateTransaction(req);
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
    
}


async function PostCreateTransaction(request) {
  const url = BaseURL + "/api/Authorize/Transaction/Create";
  try 
  {
    return await postRequest(url, JSON.stringify(request));
  } 
  catch (error) 
  {
    throw error;
  }
}

  export async function TransactionRedeem(token, status, reason) {
    try {
       
      let req = {
        InputParameters: {
          TransactionToken: token,
          RedemptionStatus: status,
          RedemptionReason : reason
        }
      }
  
      var TransactionResponse = await PostRedeemTransaction(req);
     
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };

  export async function TransactionRead(token) {
    try {
       
      let req = {
        InputParameters: {
          TransactionToken: token,
        }
      }
  
      var TransactionResponse = await PostReadTransaction(req);
     
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };

  async function PostRedeemTransaction(request) {
    const url = BaseURL + "/api/Authorize/Transaction/Redeem";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }
  
  async function PostReadTransaction(request) {
    const url = BaseURL + "/api/Authorize/Transaction/Read";
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
      const response = await fetch(url, {
        method: "POST",
        body: data,
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
          "QwantumProfile": Profile,
          "QwantumAPIKey" : WebAPIKey
        }),
      });
      return await response.json();
    } 
    catch (error) 
    {
      return error;
    }
  }