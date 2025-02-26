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
export let APIKey =  "";
export let ProfileName =  ""
  

  
   /**
   * @param {string} key
   */
  export function setAPIKey(key) {
    APIKey = key;
  }
  
  /**
   * @param {string} name
   */
  export function setProfileName(name) {
    ProfileName = name;
  }
  
  /**
   * @param {string} url
   */
  export function setURL(url) {
    BaseURL = url;
  }

  export async function GetFirmware(request) {
    const url = BaseURL + "/Firmware";
    try {
      return await postRequest(url, APIKey, JSON.stringify(request));
    } catch (error) {
      throw error;
    }
  }
  
  export async function GetTags(request) {
    const url = BaseURL + "/tags";
    try {
      return await postRequest(url, APIKey, JSON.stringify(request));
    } catch (error) {
      throw error;
    }
  }
  
  export async function GetConfig(request) {
    const url = BaseURL + "/configs";
    try {
      return await postRequest(url, APIKey, JSON.stringify(request));
    } catch (error) {
      throw error;
    }
  }
  
  async function postRequest(url, apiKey, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        body: data,
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
          APIKey: apiKey,
        }),
      });
      //return await response.json();
      let json = await response.json();
      let resp = {
        status: {
          ok: response.ok,
          text: response.statusText,
          code: response.status,
        },
        data: json
      }
      return resp;

    } catch (error) {
      return error;
    }
  }