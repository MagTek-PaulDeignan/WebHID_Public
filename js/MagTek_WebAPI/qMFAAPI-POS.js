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
export function setBaseURL(url) {
  BaseURL = url;
}

/**
 * @param {string} apiKey
 */
export function setapiKey(apiKey) {
  WebAPIKey = apiKey;
}

/**
 * @param {string} profile
 */
export function setProfile(profile) {
  Profile = profile;
}


export async function TransactionCreate( SMSNumber, EmailAddress, Claims ){
  
    try {
       
      let req = {
    
        InputParameters: {
          
          Template: "TransactionIDSendVerifyatDeviceTSYS",
          ExpirationSeconds:"600",
          EmailAddress: EmailAddress,
          SMSNumber: SMSNumber    
        },
        Claims: Claims      
      }

      
      let TransactionResponse = await PostCreateTransaction(req);
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
    
}

export async function ReadToken( TokenName){
  
    try {
       
      let req = {
        InputParameters: {
          TokenName: TokenName,
        }
      }

      
      let response = await PostReadToken(req);
      return response;
    } 
    catch (error) 
    {
      return error;
    }
    
}

export async function ReadUser( Username ){
  
    try {
       
      let req = {
        InputParameters: {
          Username: Username
        }
      }
      
      let response = await PostReadUser(req);
      return response;
    } 
    catch (error) 
    {
      return error;
    }
    
}
export async function ReedemToken( TokenName ){
  
    try {
       
      let req = {
        InputParameters: {
          TokenName: TokenName
        }        
      }

      let response = await PostReedemToken(req);
      return response;
    } 
    catch (error) 
    {
      return error;
    }
    
}



export async function SendTokenOTC( TokenName ){
  
    try {
       
      let req = {
        InputParameters: {
          TokenName: TokenName,
          Using: "SMS",
          TemplateDa:"SGkge0ZpcnN0bmFtZX0ge0xhc3RuYW1lfSwKWW91ciB7UHJvZmlsZX0gT25lLVRpbWUgQ29kZSBpcyB7T1RDfQoKdmlhIHtVc2luZ30=",
          Template: "AccessOTC",
          OTCID: TokenName          
        }        
      }

      
      let response = await PostSendTokenOTC(req);
      return response;
    } 
    catch (error) 
    {
      return error;
    }
    
}


export async function ReedemTokenTOTP( TokenName, TOTP ){
  
    try {
       
      let req = {
        InputParameters: {
          TokenName: TokenName,
          TOTP: TOTP
        }        
      }

      
      let response = await PostReedemTokenTOTP(req);
      return response;
    } 
    catch (error) 
    {
      return error;
    }
    
}


export async function ReedemTokenTOTC( TokenName, TOTC ){
  
    try {
       
      let req = {
        InputParameters: {
          TokenName: TokenName,
          OTC: TOTC
        }        
      }

      
      let response = await PostReedemTokenTOTC(req);
      return response;
    } 
    catch (error) 
    {
      return error;
    }
    
}



async function PostSendTokenOTC(request) {
  const url = BaseURL + "/api/QMFA/Authorize/Token/OTC/Send";
  try 
  {
    return await postRequest(url, JSON.stringify(request));
  } 
  catch (error) 
  {
    throw error;
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
  
      let TransactionResponse = await PostRedeemTransaction(req);
     
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
  
      let TransactionResponse = await PostReadTransaction(req);
     
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };

  export async function HIDVerify(tagID, tac) {
    try {
       
      let req = {
        InputParameters: {
          tagID: tagID,
          tac: tac          
        }
      }
  
      let TransactionResponse = await PostHIDVerifyTransaction(req);
     
      return TransactionResponse;
    } 
    catch (error) 
    {
      return error;
    }
  };

async function PostHIDVerifyTransaction(request) {
    const url = BaseURL + "/api/Authorize/HID/Verify";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }
  
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
  
async function PostReadToken(request) {
    const url = BaseURL + "/api/QMFA/Admin/Token/Read";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }
  
async function PostReedemToken(request) {
    const url = BaseURL + "/api/QMFA/Authorize/Token/Redeem";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }

async function PostReedemTokenTOTP(request) {
    const url = BaseURL + "/api/QMFA/Authorize/Token/TOTP/Verify";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }

  async function PostReedemTokenTOTC(request) {
    const url = BaseURL + "/api/QMFA/Authorize/Token/OTC/Verify";
    try 
    {
      return await postRequest(url, JSON.stringify(request));
    } 
    catch (error) 
    {
      throw error;
    }
  }


  async function PostReadUser(request) {
    const url = BaseURL + "/api/QMFA/Admin/User/Read";
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
    let response = undefined;
    let json;
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
        json = await response.json();   
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
      json = await response.json();
      let resp = {
        status: {
          ok: false,
          text: error.message,
          code: response.status,
        },
        data: json
      }
      return resp;
    }

  }