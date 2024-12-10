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


export let vendorId = 0x0801;


export function getHIDDeviceInfo(pid) {
  //This is required to account for the different report lengths
  //until we can obtain the report length from the USB capabilites
  //we will use this routine to choose lengths for known devices
  //or else we will try the most common length
  let reportLen = 0;
  let deviceType = "unknown";
  let reportID = 1;

  switch (pid) {
    case 0x01:
      reportLen = 0x19;
      deviceType = "V5";
      reportID = 0;
      break;
    case 0x03:
      reportLen = 0x19;
      deviceType = "V5";
      reportID = 1;
      break;
    case 0x11:
      reportLen = 0x3D;
      deviceType = "V5";
      reportID = 0;
      break;
    case 0x19:
      reportLen = 0x3D;
      deviceType = "V5";
      reportID = 1;
      break;
    case 0x20:
      reportLen = 0x40;
      deviceType = "ID5G3";
      reportID = 1;
      break;
    case 0x21:
      reportLen = 0x40;
      deviceType = "ID5G3";
      reportID = 0;
      break;
    case 0x1A:
      reportLen = 0x3D;
      deviceType = "V5";
      reportID = 1;
      break;
    case 0x1C:
        reportLen = 0x3d;
        deviceType = "V5";
        reportID = 1;
        break;
    case 0x1E:
      reportLen = 0x3d;
      deviceType = "V5";
      reportID = 1;
      break;
    case 0x1F:
        reportLen = 0x3d;
        deviceType = "V5";
        reportID = 1;
        break;
    case 0x2020: // DynaFlex
      reportLen = 0x40;
      deviceType = "MMS";
      reportID = 1;
      break;
    case 0x2023: // DynaProx
      reportLen = 0x40;
      deviceType = "MMS";
      reportID = 1;
      break;
    case 0x2024: // DynaProx II Go
      reportLen = 0x40;
      deviceType = "MMS";
      reportID = 1;
      break;
    default:
      reportLen = 0x40;
      deviceType = "V5";
      reportID = 1;
  }
  //_reportLen = reportLen;
  return { DeviceType: deviceType, ReportLen: reportLen, ReportID: reportID };
}

export const MMSfilters = [
    {
      vendorId: vendorId,
      productId: 0x2020, //DynaFlex
    },
    {
      vendorId: vendorId,
      productId: 0x2021, //DynaFlex Boot 0
    },
    {
      vendorId: vendorId,
      productId: 0x2022, //DynaFlex Boot 1
    },
    {
      vendorId: vendorId,
      productId: 0x2023, //  DynaProx
    },
    {
      vendorId: vendorId,
      productId: 0x2024, //  DynaProx II Go
    }
];

export const V5filters = [
     {
       vendorId: vendorId,
       productId: 0x19,
     },
     {
       vendorId: vendorId,
       productId: 0x1A, //mDynamo
     },
     {
       vendorId: vendorId,
       productId: 0x1C, //  tDynamo
     },
     {
       vendorId: vendorId,
       productId: 0x1E, //eDyanmo
     },
     {
       vendorId: vendorId,
       productId: 0x1F, //iDynamo 6
     },
     {
       vendorId: vendorId,
       productId: 0x5357, // bootloader
     }
];
export const DynaMagfilters = [
  {
    vendorId: vendorId,
    productId: 0x01,
  },
  {
     vendorId: vendorId,
     productId: 0x03,
   },
   {
    vendorId: vendorId,
    productId: 0x11,
  }   
];
export const ID5G3filters = [
    {
      vendorId: vendorId,
      productId: 0x20,
    },
    {
      vendorId: vendorId,
      productId: 0x21,
    }
];
  