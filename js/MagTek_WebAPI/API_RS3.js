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
import * as mt_Utils from './mt_utils.js';

export let BaseURL = "https://rsgw.magensa.net/rs3/api/";
export let APIKey =  "Basic V2ViSElEUlMvV2ViSElEUlM6VyFuQGMzNUdhRDdKViM=";
  
 
   /**
   * @param {string} key
   */
  export function setAPIKey(key) {
    APIKey = key;
  }
  
  
  /**
   * @param {string} url
   */
  export function setURL(url) {
    BaseURL = url;
  }

  export async function GenerateCMAC(deviceType, deviceChallenge, deviceKeySlotInfo, payload) {
    const url = BaseURL + "Crypto/CMAC/Generate";
    try {

      let req = {
        deviceType: deviceType,
        deviceChallenge: mt_Utils.sanitizeHexData(deviceChallenge),
        deviceKeySlotInfo: mt_Utils.sanitizeHexData(deviceKeySlotInfo),
        payload: mt_Utils.sanitizeHexData(payload)
      };

      return await postRequest(url, APIKey, JSON.stringify(req));
    } catch (error) {
      throw error;
    }
  }
 
  async function postRequest(url, apiKey, data) {
    let resp = null;
    try {
      
      const response = await fetch(url, {
        method: "POST",
        body: data,
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
          Authorization: apiKey,
        }),
      });
      let json = await response.json();
      resp = {
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
      resp = {
        status: {
          ok: false,
          text: error.message,
          code: 500,
        }      
    };
    return resp;
  }
}
