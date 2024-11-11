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

export let BaseURL = "https://rms.magensa.net/Test/Magensa/MPPGv4WebAPI";
export let ProcessorName = "TSYS - Pilot";

export let CustCode = "KT44746264";
export let Username = "TSYSPilotPROD";
let Password = "Password#12345";

/**
 * @param {string} url
 */
export function setURL(url) {
  BaseURL = url;
}

/**
 * @param {string} name
 */
export function setProcessorName(name) {
  ProcessorName = name;
}

/**
* @param {string} name
*/
export function setCustCode(name) {
  CustCode = name;
}

/**
 * @param {string} name
 */
export function setUsername(name) {
  Username = name;
}

  /**
   * @param {string} password
   */
export function setPassword(password) {
  Password = password;
}

  export async function ProcessSale(amount, email, sms) {
    try {
       
      let req = {
        ProcessorName: ProcessorName,
        TransactionNumber: "20220921104243",
        TransactionType: 1,
        Authentication: {
          CustomerCode: CustCode,
          Password: Password,
          Username: Username
        },
        Amount: {
          SubTotal: amount.SubTotal,
          Tax: amount.Tax,
          Tip: amount.Tip,
          CashBack: amount.CashBack
        },
        DataCaptureType: 6,
        ARQC: window.ARQCData,
        CardData: null,
        Token: null,
        ReferenceID: null,
        TransactionInputDetails: [
          {
            key: "MerchCatCode",
            value: "5999"
          }
        ],
        AdditionalRequestData: null,
        // SendReceiptTo:  
        // {
        //   SMS: sms,
        //   Email: 
        //   {
        //   To: email,
        //   Subject: "Customer Receipt"
        //   }
        // }
      }
  
    var TransactionResponse = await PostProcessTransaction(req);
     
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };
 
  async function PostProcessTransaction(request) {
    const url = BaseURL + "/ProcessTransaction";
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
          "Content-Type": "application/json"          
        }),
      });
      return await response.json();
    } 
    catch (error) 
    {
      return error;
    }
  }