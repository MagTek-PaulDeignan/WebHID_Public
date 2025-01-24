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
import * as mt_XML2JSON from "./mt_xml2json.js";

export let BaseURL = "https://svc1.magensa.net/Unigate";
export let ProcessorName = "TSYS - Pilot";

export let CustCode = "";
export let Username = "";
let Password = "";

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

  export async function ProcessSale(amount, arqc) {
    try {
       
   let req = {
      customerTransactionID: Date.now().toString(),
      transactionInput: {
        transactionType: "SALE",
        amount: amount.SubTotal,
        processorName: "TSYS - PILOT"
        },
     
      dataInput: {
        encryptedData: {
          dataType: "ARQC",
          data: arqc
        },
        paymentMode: "EMV"
      }
   }
     
      let TransactionResponse = await PostProcessTransaction(req);
      try 
        {
          let details = {};
          //mt_XML2JSON.XmltoDict(TransactionResponse.transactionOutput.transactionOutputDetails[0].value, details);    
          mt_XML2JSON.XmltoDict(TransactionResponse.transactionOutput.transactionOutputDetails[0].value, details);    
          TransactionResponse.Details = details;    
        } 
        catch (error) 
        {
      
        }
      return TransactionResponse;
    
    } 
    catch (error) 
    {
      return error;
    }
  };
 
  async function PostProcessTransaction(request) {
    const url = BaseURL + "/api/Transaction/EMV";
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
          "Authorization": getBasicAuth() 
        }),
      });
      return await response.json();
    } 
    catch (error) 
    {
      return error;
    }
  }

  function getBasicAuth() {
    let retString = `Basic ${btoa(`${CustCode}/${Username}:${Password}`)}`
    return retString;
  }