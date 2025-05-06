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
import * as mt_Utils from "./mt_utils.js";
import * as mt_XML2JSON from "./mt_xml2json.js";
export let BaseURL = "https://svc1.magensa.net/Unigate/";
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


export function getBasicAuth() {
  let retString = `Basic ${btoa(`${CustCode}/${Username}:${Password}`)}`
  return retString;
}

  export async function ProcessARQCTransaction(amount, arqc, transactionID = Date.now().toString(), transType = "SALE", paymentType = "Credit", addDetails = true) {
    try {

    let FallBack = mt_Utils.getTagValue('DFDF53', '00', arqc.substring(4), false);
    let PaymentMode = "EMV";
      switch (FallBack) {
        case '01':
          PaymentMode = 'MagStripe'
          break;
        default:
          PaymentMode = 'EMV';
          break;
        }
      

    let cardType = mt_Utils.getTagValue('DFDF52', '00', arqc.substring(4), false);
    switch (cardType) {
      case '01': case '02': case '03':  
        PaymentMode = 'MagStripe'
        break;
      default:
        PaymentMode = 'EMV';
        break;
      }

   let req = {
      customerTransactionID: transactionID,
      transactionInput: {
        transactionType: transType,
        amount: amount.SubTotal + amount.Tax + amount.Tip + amount.CashBack,
        processorName: ProcessorName
        },     
      dataInput: {
        encryptedData: {
          dataType: "ARQC",
          data: arqc
        },
        paymentMode: PaymentMode,
        paymentType: paymentType
      }
   }


     
      let TransactionResponse = await PostProcessTransaction(req);      
      
      if(TransactionResponse.status.ok == true)
      {
        if (addDetails)
        {
        // here we will parse the processor http response.  It needs to extract the XML data from the HTTP response and then convert
        // that data to a "Dictionary" object called Details.
        let details = {};          
        let bstatus = await mt_XML2JSON.KVPtoDict(TransactionResponse.data.dataOutput.additionalOutputData,details);
        if(bstatus){
          //remove them from additionalOutputData because they were moved into 'details'
          TransactionResponse.data.dataOutput.additionalOutputData = null;
        } 
        
        bstatus = await mt_XML2JSON.XmltoDict(TransactionResponse.data.transactionOutput.transactionOutputDetails[0].value, details);    
        if(bstatus){
          //add the values to 'details'
          TransactionResponse.data.Details = details;        
          //remove them from transactionOutputDetails because they were moved into 'details'
          TransactionResponse.data.transactionOutput.transactionOutputDetails = null;
        } 
        }
    }
      return TransactionResponse;
    } 
    catch (error) {return error};    
  };
 
  async function PostProcessTransaction(request) {
    let url =  `${BaseURL}api/Transaction/EMV`;
    try 
    {
      return await postRequest(url, JSON.stringify(request, replacerFloatToFixed));            
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
      
      let json = await response.json();

      //console.log(`req : ${data}`);
      //console.log(`resp: ${JSON.stringify(json,null,2)}`);
      
      let resp = 
      {
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

  
  const replacerFloatToFixed = (key, value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : value;
    }
    return value;
  };