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

export async function GetLoadFimrwareFromBase64(fileType, base64){
  let byteArray = mt_Utils.base64ToByteArray(base64);
  return GetLoadFimrwarefromByteArray(fileType,byteArray);
}

export async function GetLoadFimrwarefromByteArray(fileType, byteArray){
  let Header = 'AA00';
  let CmdID = 'D801';
  let CmdRequest = '01';
  let CmdCounter = 'E1'; 
  let ProgressInd = '810103';
  
  let AutoCommit = '';

  let SHA = await mt_Utils.sha256(byteArray, true);
  let CmdInfo = `${Header}8104${CmdRequest}${CmdCounter}${CmdID}`;

  let FileHex = mt_Utils.toHexString(byteArray);
  let FileLen = `83${mt_Utils.makeHex(byteArray.length, 6)}`;
  let FileTypeHex = mt_Utils.makeHex(fileType,4);
  let CmdData = `${CmdID}${ProgressInd}8502${FileTypeHex}8620${SHA}${AutoCommit}87${FileLen}${FileHex}`
  let CmdLen = `83${mt_Utils.makeHex(CmdData.length / 2, 6)}`;
 
  let resp = 
  {
    commitCmd: `${Header}810401E2D901842ED901${ProgressInd}8201008502${FileTypeHex}8620${SHA}`,
    firmwareCmd: `${CmdInfo}84${CmdLen}${CmdData}`
  }
  return resp;
}


export async function getImgFromPenData(imageData, width = 320, height = 240, penWidth = 2, backColor = 'white', penColor = 'black', imgType = 'image/png', imgQuality = 1, canvasName){
  let lineStart = true;
  let lineEnd = false;
  let xPos;
  let yPos;
  let coord;
  let i = 0;
  let canvas;
  try {
      
    if(canvasName == undefined)
    {
      canvas = document.createElement('canvas');
    }else
    {
      canvas = document.getElementsByName(canvasName);
    }
      canvas = document.createElement('canvas');
      canvas.height = height;
      canvas.width = width;      
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = penColor;
      ctx.fillStyle = backColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = penWidth;
      
      
      while (i < imageData.length)
      {
          coord = imageData.substring(i, i + 8);
          xPos = mt_Utils.hexToNumber(coord.substring(0,4));
          yPos = mt_Utils.hexToNumber(coord.substring(4,8));
      
         if (coord == 'FFFFFFFF') lineEnd = true;    
      
         //middle part
         if (!lineStart && !lineEnd)
          {
              ctx.lineTo(xPos, yPos);
              //console.log(`${xPos} : ${yPos} :  ${coord}`);
          }
          
          if (lineStart )
          {
              ctx.beginPath();
              ctx.moveTo(xPos, yPos);
              ctx.lineTo(xPos, yPos);
              //ctx.stroke();
              lineStart = false;    
              //console.log(`begin of line`);
          }
          
          if (lineEnd )
          {
              ctx.stroke();
              lineEnd = false;
              lineStart = true; 
              //console.log(`end of line`);   
          }    
          i += 8;    
  
      }
      return canvas.toDataURL(imgType, imgQuality);    
  } catch (error) 
  {
      return error;    
  }
  }
  