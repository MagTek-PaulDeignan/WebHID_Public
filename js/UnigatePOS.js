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

import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";
import * as mt_UI from "./mt_ui.js";
import * as mt_Unigate from "./MagTek_WebAPI/API_Unigate.js";
import * as mt_QMFA from "./MagTek_WebAPI/qMFAAPI-POS.js";
import "./MagTek_WebAPI/mt_events.js";
import DeviceFactory from "./MagTek_WebAPI/device/API_device_factory.js";
let mt_Device = DeviceFactory.getDevice("MMS_MQTT");


let lastPrintTime = 0;
const minimumGap = 2200; // 3 seconds
let ReadyForSale = false;
let OpeningTill = false;


const IMAGE_ELEMENT_ID = "person-image-display";
const CLAIMS_CONTAINER_ID = "claims-list-container";
const CLAIMS_OWNER_NAME_ID = "owner-name";
const VIDEO_ELEMENT_ID = "qr-video"; // Keeping ID reference just in case, but no longer used for camera logic

const VISIBLE_OWNER_NAME_SELECTOR = '.account-info-details h2';
const VISIBLE_OWNER_ID_SELECTOR = '.account-info-details .small:nth-child(2)';
const DEVICE_STATUS_SPAN_ID = 'USBStatus';
const DEVICE_STATUS_LABEL_ID = 'lblUSBStatus';
const TOP_ACTION_BAR_DISPLAY_ID = 'DeviceDisplay'; // Keeping the original ID, but its position is now irrelevant

const SIGNATURE_CONTAINER_ID = "signatureDisplayContainer";
const SIGNATURE_IMAGE_ID = "signature-image-display";
const BANNER_CONTAINER_ID = "bannerDisplayContainer";
const BANNER_IMAGE_ID = "banner-image-display";
const claimsListContainer = document.getElementById(CLAIMS_CONTAINER_ID);
const ownerName = document.getElementById(CLAIMS_OWNER_NAME_ID); 
const videoElement = document.getElementById(VIDEO_ELEMENT_ID);


let visibleOwnerName = document.querySelector(VISIBLE_OWNER_NAME_SELECTOR);
let visibleOwnerID = document.querySelector(VISIBLE_OWNER_ID_SELECTOR);
let deviceStatusSpan = document.getElementById(DEVICE_STATUS_SPAN_ID);
let deviceStatusLabel = document.getElementById(DEVICE_STATUS_LABEL_ID);
let topActionBarDisplay = document.getElementById(TOP_ACTION_BAR_DISPLAY_ID);


const signatureContainer = document.getElementById(SIGNATURE_CONTAINER_ID);
const signatureImage = document.getElementById(SIGNATURE_IMAGE_ID);

const bannerContainer = document.getElementById(BANNER_CONTAINER_ID);
const bannerImage = document.getElementById(BANNER_IMAGE_ID);


let retval = "";
let url = mt_Utils.getEncodedValue('MQTTURL','d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==');
let devPath = mt_Utils.getEncodedValue('MQTTDevice','');
let userName = mt_Utils.getEncodedValue('MQTTUser','RGVtb0NsaWVudA==');
let password = mt_Utils.getEncodedValue('MQTTPassword','ZDNtMENMdjFjMQ==');

let _qMFAAPIKey  = window.atob('TVRTYW5kYm94LUYwRkEzMTQwLTFFNTAtNDMzMS04QkI5LUYzM0JGOUNCMzJGQg==');
let _qMFAProfile = window.atob('U2FuZEJveA==');
let _qMFABaseURL = window.atob('aHR0cHM6Ly9ybXMubWFnZW5zYS5uZXQvUXdhbnR1bS9NRkEtVjM=');

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.devpath;
if (value != null) {
  devPath = value;
}

if (userName.length == 0 ) userName = null;
if (password.length == 0 ) password = null;


document
   .querySelector("#deviceOpen")
   .addEventListener("click", handleOpenButton);

document
   .querySelector("#clearCart-btn")
   .addEventListener("click", clearCart);

document
   .querySelector("#charge-btn")
   .addEventListener("click", initiatePayment);

document
   .querySelector("#customTip-btn")
   .addEventListener("click", applyCustomTip);

document
  .querySelector("#openRegister-btn")
  .addEventListener("click", handleOpenTill);

document
  .querySelector("#sendReceipt-btn")
  .addEventListener("click", handleSendeReciept);

document.addEventListener("DOMContentLoaded", handleDOMLoaded);


async function handleOpenTill()
{
    let PrinterPath = mt_Utils.getEncodedValue("MPPG_Printer", "");
    if (PrinterPath.length > 0 )
    {
      
      OpeningTill = true;
      showPaymentModal();
      ReadyForSale = false;
      updatePaymentinstruction("Present Token to Open Till");
      
      // const now = new Date();
      // // Format date: "4/21/2026"
      // const dateStr = now.toLocaleDateString();
      // // Format time: "4:53:44 PM"
      // const timeStr = now.toLocaleTimeString();
      // mt_UI.LogData("Opening Cash Drawer...");    
      // await mt_Device.StarPrintData(PrinterPath, `Till was opened - Date: ${dateStr}, Time: ${timeStr}`, "end");
    }  
}
function handleSendeReciept()
{
    mt_UI.LogData("Sending Electronic Receipt...");
    mt_Device.sendCommand("AA008104010118408441184081010182010F833768747470733A2F2F726D732E6D6167656E73612E6E65742F546F6B656E2F6572656365697074732F72657374617572616E742E68746D6C");
}

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};

// Initialize the access display
// function initAccessDisplay() {
//     const display = document.getElementById('access-display');
//     if (!display) return;
    
//     display.innerHTML = ''; // Clear existing
    
//     const card = document.createElement('div');
//     card.className = 'attendance-tile empty'; // Reusing class for styling, but will override size in CSS or inline
//     card.id = 'access-card';
//     card.style.position = 'relative';
//     card.style.width = '100%';
//     card.style.maxWidth = '500px';
//     card.style.height = '400px'; // Taller for single view
//     card.style.fontSize = '1.2rem';

//     card.innerHTML = `
//         <div style="font-size: 5rem; margin-bottom: 20px; opacity: 0.5;">+</div>
//         <div class="h4">Ready to Scan</div>
//         <div class="small opacity-75">Present Token for Access</div>
//     `;
    
//    display.appendChild(card);
// }


async function handleDOMLoaded() {
  mt_UI.LogData(`Configured Device: ${devPath}`);
  handleOpenButton();
  mt_QMFA.setBaseURL(_qMFABaseURL);
  mt_QMFA.setProfile(_qMFAProfile);
  mt_QMFA.setapiKey(_qMFAAPIKey);

  mt_Unigate.setUsername(mt_Utils.getEncodedValue("MPPG_UserName", "VFNZU1BpbG90UFJPRA=="));
  mt_Unigate.setPassword(mt_Utils.getEncodedValue("MPPG_Password", "UGFzc3dvcmQjMTIzNDU="));
  mt_Unigate.setCustCode(mt_Utils.getEncodedValue("MPPG_CustCode", "S1Q0NDc0NjI2NA=="));
  mt_Unigate.setProcessorName(mt_Utils.getEncodedValue("MPPG_ProcessorName", "VFNZUyAtIFBJTE9U"));
  mt_UI.LogData(`Configured to use: ${mt_Unigate.ProcessorName}`);

  
  //initAccessDisplay();
  loadSettings();
  renderTabs();
  updateCartUI();
  
    
    // Initialize Theme
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('posTheme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('posTheme', newTheme);
            updateThemeIcon(newTheme);
        });
        
        function updateThemeIcon(theme) {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }
    }
    
    // Initialize Modals
    const modalEl = document.getElementById('paymentModal');
    if (modalEl) {
        paymentModalInstance = new bootstrap.Modal(modalEl);
    }

    const tipModalEl = document.getElementById('tipModal');
    if (tipModalEl) {
        tipModalInstance = new bootstrap.Modal(tipModalEl);
    }
    
    const settingsModalEl = document.getElementById('settingsModal');
    if (settingsModalEl) {
        settingsModalInstance = new bootstrap.Modal(settingsModalEl);
        
        // Settings UI Event Listeners
        const tipEnabledCheck = document.getElementById('setting-tip-enabled');
        const tipOptionsContainer = document.getElementById('tip-options-container');
        
        if (tipEnabledCheck && tipOptionsContainer) {
            tipEnabledCheck.addEventListener('change', (e) => {
                tipOptionsContainer.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        
        // Populate Settings UI when modal opens
        settingsModalEl.addEventListener('show.bs.modal', populateSettingsUI);
    }

};

async function handleCloseButton() {
  await mt_Device.closeDevice();
  mt_UI.ClearLog();
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  window.mt_device_ARQCData = null;  
}

 async function handleProcessSale() {
  
  if (window.mt_device_ARQCData != null) {
    let amt = transactionSubTotal
    if (amt > 0)
    {
      if(true)
        updatePaymentinstruction("Processing...")
        {
          let Amount = {
            SubTotal: 0,
            Tax: 0,
            Tip: 0,
            CashBack: 0
          }
          
          let tax = transactionTaxTotal
          let tip = transactionTipTotal
          
          Amount.SubTotal = parseFloat(amt);
          Amount.Tax = parseFloat(tax);
          Amount.Tip = parseFloat(tip);
    
          
            mt_Unigate.setUsername(mt_Utils.getEncodedValue("MPPG_UserName", "VFNZU1BpbG90UFJPRA=="));
            mt_Unigate.setPassword(mt_Utils.getEncodedValue("MPPG_Password", "UGFzc3dvcmQjMTIzNDU="));
            mt_Unigate.setCustCode(mt_Utils.getEncodedValue("MPPG_CustCode", "S1Q0NDc0NjI2NA=="));
            mt_Unigate.setProcessorName(mt_Utils.getEncodedValue("MPPG_ProcessorName", "VFNZUyAtIFBJTE9U"));

            let saleResp = await mt_Unigate.ProcessARQCTransaction(Amount, window.mt_device_ARQCData, undefined, "SALE", "Credit", true);  
            updatePaymentinstruction("Processing Complete...")

            if(saleResp.status.code == 200)
              {
                let claims = saleResp.data.Details;
                claims.magTranID = saleResp.data.magTranID;
                window.mt_device_SaleResponse = saleResp.data;               
            }
                       
              if (saleResp.status.code == 200)
              {
                // ReadyForSale = false;
                // clearCart();
                // paymentModalInstance.hide();

                if(Object.keys(saleResp.data.Details).length  > 0 )
                  {
                    mt_UI.LogData(`=====================Processor Response KVPs=====================`);
                    for (var key in saleResp.data.Details) {
                      if (saleResp.data.Details.hasOwnProperty(key))
                        {
                          if (!key.endsWith("Receipt"))
                          {
                            mt_UI.LogData(`${key}: ${saleResp.data.Details[key]}` );
                          }
                          else
                          {
                            let Outdata = saleResp.data.Details[key].replace(/\\n/g, '\n');
                            let PrinterPath = mt_Utils.getEncodedValue("MPPG_Printer", "");
                            let _CashDrawer = "none";

                            if( key == "merchantReceipt") _CashDrawer = "end";

                            if(PrinterPath.length > 0 )
                            {
                                mt_UI.LogData(`Printing ${key} to ${PrinterPath}`);
                                const timeSinceLastPrint = Date.now() - lastPrintTime;
                
                                if (lastPrintTime !== 0 && timeSinceLastPrint < minimumGap) 
                                {
                                  const delayNeeded = minimumGap - timeSinceLastPrint;
                                  await mt_Utils.wait(delayNeeded);
                                }
                                await mt_Device.StarPrintData(PrinterPath, Outdata, _CashDrawer);
                                lastPrintTime = Date.now();
                            }
                            else
                            {
                              mt_UI.LogData(`============================${key}============================`);
                              mt_UI.LogData(`${Outdata}`);
                              mt_UI.LogData(`============================${key}============================`);          
                            }
                            
                          }
                        }
                    }
                    mt_UI.LogData(`======================Processor Response KVPs======================`);
                  }

                  mt_UI.LogData(``);
                  mt_UI.LogData(`======================Transaction Response Details======================`);
                  mt_UI.LogData(JSON.stringify(saleResp.data, null, 2));
                  mt_UI.LogData(`======================Transaction Response Details======================`);                

                  mt_UI.LogData(``);
                  let Outdata = saleResp.data.Details.customerReceipt.replace(/\\n/g, '\n');
                  mt_UI.LogData(`============================Receipt=============================`);
                  mt_UI.LogData(`${Outdata}`);
                  mt_UI.LogData(`============================Receipt============================`);

              }
              window.mt_device_ARQCData = null;
              ReadyForSale = false;
              clearCart();
              paymentModalInstance.hide();              
        }
    }
   } 
   
 }

async function handleOpenButton() {
  mt_Device.setURL(url);
  mt_Device.setUserName(userName);
  mt_Device.setPassword(password);
  mt_Device.setPath(devPath);  
  mt_Device.setDeviceList(mt_Utils.getEncodedValue("MQTTDeviceList", "TWFnVGVrL1VTLysvKy8rLysvKy9TdGF0dXM="));
  mt_Device.openDevice();
}

async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}

async function parseCommand(message) {
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      //mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      //mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      mt_Device.sendCommand(cmd[1]);
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":      
      mt_Device.openDevice();      
      break;
    case "CLOSEDEVICE":      
      mt_Device.closeDevice();
      break;
    case "WAIT":
      await mt_Utils.wait(cmd[1]);
      break;
    case "DETECTDEVICE":
      //window._device = await mt_MMS.openDevice();      
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);
      mt_UI.LogData(retval);
      break;
    case "PARSETLV":
      retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    case "PROCESS_SALE": 
      handleProcessSale();
      break;
    default:
      //mt_Utils.debugLog("Unknown Command");
  }
};



const deviceConnectLogger = (e) => {
  document.getElementById("lblUSBStatus").innerText = "Connected";  
};
const deviceDisconnectLogger = (e) => {
  document.getElementById("lblUSBStatus").innerText = "Disconnected";
};

const deviceCloseLogger = (e) => {
  document.getElementById("lblUSBStatus").innerText = "Closed";  
};
const deviceOpenLogger = async (e) => {
  document.getElementById("lblUSBStatus").innerText = "Opened";
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
};

const trxCompleteLogger = (e) => {
  if (ReadyForSale) 
    {
    updatePaymentinstruction("Done Reading Card")
    handleProcessSale();
  }

};
const displayMessageLogger = (e) => {
  mt_UI.DeviceDisplay(e.Data);
};

const barcodeLogger = async (e) => {

  if (ReadyForSale)
  {
    let bcData = mt_Utils.getTagValue("DF74", "", e.Data, true);
    mt_UI.LogData("Redeeming Token");
    const ownerData = await redeemToken(bcData, "barcode");
    if (ownerData){
      displayClaims(ownerData);  
   } 
  }

  if (OpeningTill)
  {
    let PrinterPath = mt_Utils.getEncodedValue("MPPG_Printer", "");

    if (PrinterPath.length > 0 ){
      let bcData = mt_Utils.getTagValue("DF74", "", e.Data, true);
      mt_UI.LogData("Redeeming Token");
      const ownerData = await redeemToken(bcData, "barcode");
      if (ownerData)
      {
        const now = new Date();
        // Format date: "4/21/2026"
        const dateStr = now.toLocaleDateString();
        // // Format time: "4:53:44 PM"
        const timeStr = now.toLocaleTimeString();
        let TillOpenString = "none";
        let tillMsg = "";
        mt_UI.LogData("Opening Till...");           
        if(ownerData.owner.data.claims.TillAccess == 'admin')
        {
            TillOpenString = "end";
            tillMsg = `${ownerData.owner.data.firstName} ${ownerData.owner.data.lastName} Opened the till at: ${dateStr} ${timeStr} `            
        }
        else
        {
          tillMsg = `${ownerData.owner.data.firstName} ${ownerData.owner.data.lastName} is not authorized to open the till at: ${dateStr} ${timeStr} `              
          TillOpenString = "none";
        }
        await mt_Device.StarPrintData(PrinterPath, tillMsg, TillOpenString);         
      }
      }
    cancelTransaction();
  
  }
};

const barcodeUpdateLogger = async (e) => {
  if (ReadyForSale)
  {
    let bcData = mt_Utils.getTagValue("DF74", "", e.Data.substring(40), true);
    mt_UI.LogData("Redeeming Token");
    const ownerData = await redeemToken(bcData, "barcode");
    if (ownerData){
      displayClaims(ownerData);            
   } 
  }
};

const arqcLogger = (e) => {
  window.mt_device_ARQCData = e.Data;
  window.mt_device_ARQCType = e.Source;  
};
const batchLogger = (e) => {
};
const fromDeviceLogger = (e) => {
      mt_UI.LogData(`Device Response Status Code: ${e.Data.OperationStatusCode}${e.Data.OperationDetailCode}`);
      mt_UI.LogData(`Device Response Status: ${e.Data.OperationStatus} : ${e.Data.OperationDetail}`);
};
const inputReportLogger = (e) => {
  //mt_UI.LogData(`Input Report: ${e.Data}`);
};
const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const debugLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const touchUpLogger = (e) => {
   let chk = document.getElementById("chk-AutoTouch");
   if (chk.checked) {
     mt_UI.LogData(`Touch Up: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
   }
};

const touchDownLogger = (e) => {
  let chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Down: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};

const contactlessCardDetectedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Detected`);
  if (e.Data.toLowerCase() == "idle" && ReadyForSale) {
    mt_UI.LogData(`Auto Starting...`);
    mt_Device.sendCommand("AA008104010010018430100182010AA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }  
};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = (e) => {
  
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);
  if (e.Data.toLowerCase() == "idle" && ReadyForSale) 
  {
    mt_UI.LogData(`Auto Starting EMV...`);
    mt_Device.sendCommand("AA008104010010018430100182010AA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }
};

const contactCardRemovedLogger = (e) => {  
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Removed`);
};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected`);
  if (e.Data.toLowerCase() == "idle" && ReadyForSale) {  
    mt_UI.LogData(`Auto Starting MSR...`);
    mt_Device.sendCommand("AA008104010010018430100182010AA30981010182010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const mqttStatus = e => {
  //let topicArray = e.Data.Topic.split('/');
  //let deviceStatus = e.Data.Message;
  //let deviceType = topicArray[topicArray.length-3];
  //let deviceName = topicArray[topicArray.length-2];

    let topicArray = e.Data.Topic.split('/');
  let deviceStatus = e.Data.Message;
  let deviceType = topicArray[topicArray.length-3];
  let deviceName = topicArray[topicArray.length-2];  
  let deviceURL = `${window.location.pathname}?devpath=${mt_Utils.removeLastPathSegment(e.Data.Topic)}`;
  mt_UI.AddDeviceLink(deviceType, deviceName, deviceStatus, deviceURL);

}

// MODIFIED: redeemToken to return owner.data object on success or null on failure
async function redeemToken(tokendata, tokenType){
 
 
  let tokenArray = ""
  let tokenPrefix = "";
  let searchToken = "";
  let tokenCode = "";
  let token = null;

  switch (tokenType.toLowerCase()) {
    case "barcode":
      tokenArray = tokendata.split('~');  
      if (tokenArray.length >= 2) 
      {
        tokenPrefix = tokenArray[0];  
        searchToken = `${tokenArray[0]}~${tokenArray[1]}`;
        if (tokenArray.length >= 3) 
        {
          tokenCode = tokenArray[2];
        }
      }

      if (tokenArray.length == 1) {
        searchToken = tokenArray[0];
      }
      break;
    case "nfc":
      searchToken = tokendata;
      break;
    case "arqc":
      mt_UI.LogData(`ARQC is not currently supported`);    
      //showErrorModal(`ARQC is not currently supported`);
      updatePaymentinstruction(`ARQC is not currently supported`);
      return null; 
    default:
      break;
  }  

  
  token = await mt_QMFA.ReadToken(searchToken);
  if (!token.status.ok)
  {
    let msg = token.status.text || "Error reading token";
    if (token.data && token.data.message) msg += ": " + token.data.message;
    mt_UI.LogData(msg);
    mt_UI.LogData(JSON.stringify(token.data));
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null; 
  }

  let owner = await mt_QMFA.ReadUser(token.data.ownerID);

  if (!owner.status.ok)
  {
    let msg = owner.status.text || "Error reading user";
    if (owner.data && owner.data.message) msg += ": " + owner.data.message;
    mt_UI.LogData(JSON.stringify(owner.data));
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null; 
  }

  if (owner.data.isExpired) {
    let msg = `${owner.data.firstName} ${owner.data.lastName} is expired`;
    mt_UI.LogData(msg);
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null; 
  }

  if (owner.data.isBlocked) {
    let msg = `${owner.data.firstName} ${owner.data.lastName} is blocked`;
    mt_UI.LogData(msg);
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null;     
  }

  if (owner.data.isLocked) {
    let msg = `${owner.data.firstName} ${owner.data.lastName} is locked`;
    mt_UI.LogData(msg);
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null; 
  }

  if (token.data.isExpired) {
    let msg = `${owner.data.firstName} ${owner.data.lastName} - Token ${token.data.description} is expired`;
    mt_UI.LogData(msg);
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null; 
  }

  if (token.data.enabled === false) {
    let msg = `${owner.data.firstName} ${owner.data.lastName} - Token ${token.data.description} is Disabled`;
    mt_UI.LogData(msg);
    //showErrorModal(msg);
    updatePaymentinstruction(msg);

    return null; 
  }

  token = await mt_QMFA.ReedemToken(searchToken)

  if (!token.status.ok)
  {
    let msg = token.status.text || "Error redeeming token";
    if (token.data && token.data.message) msg += ": " + token.data.message;
    mt_UI.LogData(token.status.text);
    mt_UI.LogData(JSON.stringify(token.data));
    //showErrorModal(msg);
    updatePaymentinstruction(msg);
    return null; 
  }
  if (tokenPrefix.toUpperCase() == "OTC")
  {
    if (tokenCode == "")
    {
      mt_UI.LogData("Sending OTC");
      await mt_QMFA.SendTokenOTC(searchToken)
      //showErrorModal("OTC Sent. Please scan again with OTC.");
      updatePaymentinstruction("OTC Sent. Please scan again with OTC.");
      return null; 
    }
    else
    {
      token = await mt_QMFA.ReedemTokenTOTC(searchToken, tokenCode)
      if (!token.status.ok)
      {
        let msg = token.status.text || "Error redeeming OTC";
        if (token.data && token.data.message) msg += ": " + token.data.message;
        mt_UI.LogData(token.status.text);
        mt_UI.LogData(JSON.stringify(token.data));
        //showErrorModal(msg);
        updatePaymentinstruction(msg);
        return null; 
      }
    }
    
    if (!token.status.ok)
    {
      let msg = token.status.text || "Error redeeming OTC";
      if (token.data && token.data.message) msg += ": " + token.data.message;
      mt_UI.LogData(token.status.text);
      mt_UI.LogData(JSON.stringify(token.data));
      //showErrorModal(msg);
      updatePaymentinstruction(msg);
      return null; 
    }
  }

  if (tokenPrefix.toUpperCase() == "TOTP"){
    token = await mt_QMFA.ReedemTokenTOTP(searchToken, tokenCode)
    if (!token.status.ok)
    {
      let msg = token.status.text || "Error redeeming TOTP";
      if (token.data && token.data.message) msg += ": " + token.data.message;
      mt_UI.LogData(token.status.text);
      mt_UI.LogData(JSON.stringify(token.data));
      //showErrorModal(msg);
      updatePaymentinstruction(msg);
      return null; 
    }
  }

 
  let ret ={
    token : token,
    owner : owner,
    searchToken: searchToken // NEW: Return the searchToken so we can track it
  };
  return ret; // Return the owner and token data as an object on success
}

/**
 * Renders dynamic key-value pairs from the claims object into the list container.
 * @param {Object} claims The parsed claims object (e.g., owner.data.claims).
 * @param {string} claimsSource 'Owner' or 'Token'
 */
function renderDynamicClaims(claims, claimsSource) {
  if (Object.keys(claims).length === 0) return;

  // Add a header for the claims source (Owner or Token) - Highlighted section header
  const headerItem = document.createElement('div');
  headerItem.className = 'claims-section-header';
  headerItem.innerHTML = `<h6 class="fw-bold mb-0">${claimsSource} Claims</h6>`;
  claimsListContainer.appendChild(headerItem); 

  for (const [key, value] of Object.entries(claims)) {
    let displayValue = value;
    // Format key from camelCase/PascalCase to Title Case (e.g., 'employeeID' -> 'Employee ID')
    let label = key.replace(/([A-Z])/g, ' $1').trim(); 
    let valueClass = 'text-muted';
    let badgeHtml = '';

    // Determine if the claim value represents a numeric/financial value
    const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
    
    if (isNumeric) {
      // Apply green for positive numbers, red for negative/liabilities (like in the image)
      const numericValue = parseFloat(value);
      valueClass = numericValue >= 0 ? 'account-balance text-success' : 'account-balance text-danger';
      
      // Format as currency if it looks like one
      if (label.toLowerCase().includes('amount') || label.toLowerCase().includes('balance') || label.toLowerCase().includes('count')) {
        displayValue = (key.toLowerCase().includes('count')) ? numericValue.toLocaleString() : `$${numericValue.toFixed(2).toLocaleString()}`;
      }
    }
    
    // Special handling for boolean or status-type fields (like AlarmAware)
    if (typeof value === 'boolean' || ['Status', 'Aware', 'Clearance'].some(s => key.includes(s))) {
      const isPositive = (value === true || String(value).toUpperCase() === 'TRUE' || String(value).toUpperCase() === 'ACTIVE' || String(value).toUpperCase() === 'HIGH');
      // Using Bootstrap classes for visual status, aligned with the new UI (though the image didn't show badges)
      const badgeColor = isPositive ? 'text-danger fw-bold' : 'text-success fw-bold'; 
      const badgeText = String(value).toUpperCase();
      
      // Rendered as a bold value instead of a badge to fit the list style
      badgeHtml = `<span class="${badgeColor}">${badgeText}</span>`; 
      displayValue = ''; 
      valueClass = '';
      label = key.replace(/([A-Z])/g, ' $1').trim();
    }
    
    const listItem = document.createElement('li');
    // MODIFIED: Display key and value side-by-side, left justified
    listItem.className = 'list-group-item account-list-item'; 
    listItem.innerHTML = `
      <span class="account-title fw-bold text-secondary">${label}:</span> <span class="account-balance">${badgeHtml || `<span class="${valueClass}">${displayValue}</span>`}</span>
    `;
    claimsListContainer.appendChild(listItem);
    mt_UI.LogData(`   ${key} : ${value} `);
  }
}



function displayClaims(dataObject) {
  // Dispatch event for POS integration
  const event = new CustomEvent('TokenRedeemed', { 
      detail: { 
          owner: dataObject.owner.data, 
          token: dataObject.token.data 
      } 
  });
  document.dispatchEvent(event);

  const ownerFirstName = dataObject.owner.data.firstName;
  const ownerLastName = dataObject.owner.data.lastName;
  const ownerID = dataObject.owner.data.claims ? dataObject.owner.data.claims.employeeID || dataObject.owner.data.claims.ID : null;
  
  mt_UI.LogData(`Redeemed Token for ${ownerFirstName} ${ownerLastName}:`);
  
  // Clear previous dynamic claims display
  claimsListContainer.innerHTML = ''; 
  
  // --- Update fixed UI elements (MODIFIED for new UI structure) ---
  
  // 1. Update Account Info Card (Visible Text)
  if (visibleOwnerName) {
    visibleOwnerName.textContent = `${ownerFirstName} ${ownerLastName}`;
  }
  if (visibleOwnerID && ownerID) {
    // Assuming ID is meant to replace the placeholder ID (##-4444-1234)
    visibleOwnerID.innerHTML = `ID: **${ownerID}**`;
  } else if (visibleOwnerID) {
    visibleOwnerID.innerHTML = `ID: **N/A**`;
  }
  
  // Update Hidden Owner Name element (for backward compatibility if other scripts use it)
  ownerName.textContent = `Owner: ${ownerFirstName} ${ownerLastName}`; 
  
  // Update Top Action Bar Display (Keeping the original element, though hidden)
  mt_UI.DeviceDisplay(`Qwantum Token Authenticated: ${ownerFirstName} ${ownerLastName}`);
  if(topActionBarDisplay) {
    topActionBarDisplay.className = 'd-none'; // Ensure this element is hidden in the new UI
  }
  
  // 2. Render Uses Count (keep side-by-side)
  const usesCount = dataObject.token.data.numUsesCount;

  if (usesCount !== undefined && usesCount !== null) {
    const usesItem = document.createElement('li');
    // MODIFIED: Left justify Token Use Count
    usesItem.className = 'list-group-item account-list-item bg-info bg-opacity-10'; 
    
    // Get current date and time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${month}/${day}/${year}`;

    usesItem.innerHTML = `
     <div><span class="account-title fw-bold text-primary">Token Use Count:</span> <span class="account-balance text-primary fw-bold">${usesCount}</span></div>
      <div class="text-muted small ms-3">Last Redeemed at ${timeString} on ${dateString}</div>
    `;
    claimsListContainer.appendChild(usesItem);
    mt_UI.LogData(`   numUsesCount : ${usesCount} `);
  }
  
  // 3. Render Owner Claims
  if (dataObject.owner.data.claims) {
    renderDynamicClaims(dataObject.owner.data.claims, 'Owner');
  }
    
  // 4. Render Token Claims
  if (dataObject.token.data.claims) {
    renderDynamicClaims(dataObject.token.data.claims, 'Token');
  } 
  
  if (claimsListContainer.innerHTML === '') {
    // Use a simple list item if no claims were rendered
    claimsListContainer.innerHTML = `
       <li class="list-group-item d-flex justify-content-center text-muted" id="initial-claims-message">
         No custom claims data found.
       </li>
      `;
  }
  

  // 5. Image Loading Logic (Find imageURL in claims)
  let imageUrl = dataObject.owner.data.claims ? dataObject.owner.data.claims.imageURL : null;
  const imageElement = document.getElementById(IMAGE_ELEMENT_ID); // Hidden element for data targets
  
  // Get the visible profile image container to update the initials/avatar
  const profileAvatar = document.querySelector('.profile-avatar'); 

  // Always update the avatar with the user's initials
  if (profileAvatar) {
    const initials = `${ownerFirstName ? ownerFirstName[0].toUpperCase() : ''}${ownerLastName ? ownerLastName[0].toUpperCase() : ''}` || 'JAS';
    profileAvatar.textContent = initials;
  }
  
  // If you need the URL for some reason, you can still update the hidden <img>
  const validExtensions = /\.(jpg|jpeg|png|gif)$/i; 
  if (imageUrl && imageElement && typeof imageUrl === 'string' && imageUrl.length > 0) {
    if (validExtensions.test(imageUrl)) {
      imageElement.src = imageUrl;
      imageElement.alt = `Profile image for ${ownerFirstName} ${ownerLastName}`;
      mt_UI.LogData(`Loading image from: ${imageUrl}`);
    } else {
      mt_UI.LogData(`ERROR: 'imageURL' claim found, but URL has an invalid extension: ${imageUrl}`);
      imageElement.src = 'https://placehold.co/150x150/e0f2fe/0369a1?text=PROFILE'; // Reset to placeholder
    }
  } else if (imageElement) {
    imageElement.src = 'https://placehold.co/150x150/e0f2fe/0369a1?text=PROFILE'; // Reset to placeholder
  }
  
  // 6. Signature Loading Logic (No change needed here as the elements are hidden but preserved)
  let signatureUrl = dataObject.owner.data.claims ? dataObject.owner.data.claims.signatureURL : null;

  if (signatureUrl && signatureContainer && signatureImage && typeof signatureUrl === 'string' && signatureUrl.length > 0) {
    if (validExtensions.test(signatureUrl)) {
      signatureImage.src = signatureUrl;
      signatureImage.alt = `Signature for ${ownerFirstName} ${ownerLastName}`;
      signatureContainer.style.display = 'flex'; // Show the container
      mt_UI.LogData(`Loading signature from: ${signatureUrl}`);
    } else {
      mt_UI.LogData(`ERROR: 'signatureURL' claim found, but URL has an invalid extension: ${signatureUrl}`);
      signatureContainer.style.display = 'none'; // Hide if invalid
    }
  } else if (signatureContainer) {
    // If no signature URL is present, ensure the container is hidden
    signatureContainer.style.display = 'none';
  }

  // 7. Banner Loading Logic (No change needed here as the elements are hidden but preserved)
  let bannerUrl = dataObject.token.data.claims ? dataObject.token.data.claims.bannerURL : null;

  if (bannerUrl && bannerContainer && bannerImage && typeof bannerUrl === 'string' && bannerUrl.length > 0) {
      bannerImage.src = `images/${bannerUrl}.png`;
      bannerImage.alt = `banner for ${ownerFirstName} ${ownerLastName}`;
      bannerContainer.style.display = 'flex'; // Show the container
      mt_UI.LogData(`Loading banner from: ${bannerUrl}`);
  } 
  else if (bannerContainer) {
    // If no banner URL is present, ensure the container is hidden
    bannerContainer.style.display = 'none';
    bannerImage.src="./images/banner.png"; // Reset placeholder
  }
}



const productThemes = {
"Appetizers": [
{ id: 1, name: "Stuffed Ziti Fritta", price: 8.99, color: "bg-warning" },
{ id: 2, name: "Lasagna Fritta", price: 10.99, color: "bg-warning" },
{ id: 3, name: "Calamari", price: 11.99, color: "bg-warning" },
{ id: 4, name: "Fried Mozzarella", price: 7.79, color: "bg-dark" },
{ id: 5, name: "Toasted Ravioli", price: 9.49, color: "bg-danger" },
{ id: 6, name: "Spinach-Artichoke Dip", price: 10.49, color: "bg-danger" },
{ id: 7, name: "Shrimp Fritto Misto", price: 12.99, color: "bg-success" },
{ id: 8, name: "Meatballs Parmigiana", price: 10.79, color: "bg-success" },
{ id: 9, name: "Breadsticks (6)", price: 4.49, color: "bg-info" },
{ id: 10, name: "Dipping Sauce Trio", price: 4.49, color: "bg-primary" },
{ id: 11, name: "Pasta e Fagioli", price: 6.99, color: "bg-primary" },
{ id: 12, name: "Chicken & Gnoccchi Soup", price: 6.99, color: "bg-dark" }
],
"Entrees": [
{ id: 101, name: "Tour of Italy", price: 19.99, color: "bg-info" },
{ id: 102, name: "Chicken Parmigiana", price: 18.99, color: "bg-dark" },
{ id: 103, name: "Fettuccine Alfredo", price: 15.99, color: "bg-warning" },
{ id: 104, name: "Lasagna Classico", price: 17.49, color: "bg-primary" },
{ id: 105, name: "Shrimp Alfredo", price: 20.29, color: "bg-success" },
{ id: 106, name: "Chicken Scampi", price: 19.49, color: "bg-danger" },
{ id: 107, name: "Eggplant Parmigiana", price: 16.49, color: "bg-danger" },
{ id: 108, name: "Chicken Marsala", price: 19.49, color: "bg-info" },
{ id: 109, name: "Herb-Grilled Salmon", price: 20.79, color: "bg-primary" },
{ id: 110, name: "6oz Sirloin & Fettuccine", price: 21.49, color: "bg-dark" },
{ id: 111, name: "Five Cheese Ziti al Forno", price: 16.99, color: "bg-warning" },
{ id: 112, name: "Chicken Tortelloni Alfredo", price: 20.49, color: "bg-success" }
],
"Beverages": [
{ id: 201, name: "Raspberry Lemonade", price: 3.59, color: "bg-danger" },
{ id: 202, name: "Classic Lemonade", price: 3.59, color: "bg-danger" },
{ id: 203, name: "Peach-Mango Iced Tea", price: 3.59, color: "bg-warning" },
{ id: 204, name: "Unsweetened Iced Tea", price: 3.29, color: "bg-warning" },
{ id: 205, name: "Coca-Cola", price: 3.29, color: "bg-success" },
{ id: 206, name: "Sprite", price: 3.29, color: "bg-dark" },
{ id: 207, name: "Acqua Panna Water", price: 3.59, color: "bg-primary" },
{ id: 208, name: "San Pellegrino", price: 3.59, color: "bg-primary" },
{ id: 209, name: "Gallon Iced Tea", price: 6.99, color: "bg-dark" },
{ id: 210, name: "Hot Coffee", price: 2.99, color: "bg-info" },
{ id: 211, name: "Iced Coffee", price: 3.79, color: "bg-info" },
{ id: 212, name: "Strawberry-Passion Fruit Limonata", price: 4.29, color: "bg-success" }
]
};

let cart = [];
let keypadInput = "";
let currentGeoLocation = null;

// Transaction State
let transactionSubTotal = 0.00;
let transactionTaxTotal = 0.00;
let transactionTipTotal = 0.00;
let transactionTotal = 0.00;

let amountPaidSoFar = 0.00;
let remainingDue = 0.00;
let paymentModalInstance = null;
let settingsModalInstance = null;
let tipModalInstance = null;

// Settings State
let appSettings = {
    merchantName: "MagTek, Inc.",
    address1: "1710 Apollo Court",
    address2: "",
    cityStateZip: "Seal Beach, CA 90740",
    phone: "562-546-6400",
    website: "https://www.magtek.com",
    email: "sales@magtek.com",
    taxRate: 8.00,
    tipEnabled: false,
    tipType: '%',
    defaultTip: 0,
    tipOptions: [15, 18, 20]
};



/* -------------------------------------------------------------------------- */
/* Tab LOGIC                               */
/* -------------------------------------------------------------------------- */

function renderTabs() {
    
  let grid = document.getElementById('tabs-grid1');
    if (!grid) return;
    
    let currentProducts = productThemes["Appetizers"];

    grid.innerHTML = currentProducts.map(p => `
        <div class="col-6 col-lg-4 col-xl-3">
            <div class="card item-tile ${p.color}" onclick="addToCart('${p.name}', ${p.price})">
                <div class="card-body d-flex flex-column justify-content-center align-items-center w-100 h-100">
                    <h6>${p.name}</h6>
                    <span>$${p.price.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');

    grid = document.getElementById('tabs-grid2');
    if (!grid) return;
    
    currentProducts = productThemes["Entrees"];

    grid.innerHTML = currentProducts.map(p => `
        <div class="col-6 col-lg-4 col-xl-3">
            <div class="card item-tile ${p.color}" onclick="addToCart('${p.name}', ${p.price})">
                <div class="card-body d-flex flex-column justify-content-center align-items-center w-100 h-100">
                    <h6>${p.name}</h6>
                    <span>$${p.price.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');

    grid = document.getElementById('tabs-grid3');
    if (!grid) return;
    
    currentProducts = productThemes["Beverages"];

    grid.innerHTML = currentProducts.map(p => `
        <div class="col-6 col-lg-4 col-xl-3">
            <div class="card item-tile ${p.color}" onclick="addToCart('${p.name}', ${p.price})">
                <div class="card-body d-flex flex-column justify-content-center align-items-center w-100 h-100">
                    <h6>${p.name}</h6>
                    <span>$${p.price.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');

}

/* -------------------------------------------------------------------------- */
/* KEYPAD LOGIC                               */
/* -------------------------------------------------------------------------- */

window.keypadPress = function(val) {
    if (val === 'C') {
        keypadInput = "";
    } else {
        // Prevent multiple decimals
        if (val === '.' && keypadInput.includes('.')) return;
        // Limit length
        if (keypadInput.length > 8) return;
        
        keypadInput += val;
    }
    updateKeypadDisplay();
};

function updateKeypadDisplay() {
    const display = document.getElementById('keypad-display');
    if (keypadInput === "") {
        display.innerText = "$0.00";
    } else {
        // If input is just numbers, treat as cents? Or just raw string?
        // Let's treat as raw string for simplicity, but maybe format it?
        // Simple approach: just show what is typed
        display.innerText = "$" + keypadInput;
    }
}

window.addCustomAmount = function() {
    const amount = parseFloat(keypadInput);
    if (!isNaN(amount) && amount > 0) {
        addToCart("Custom Amount", amount);
        keypadInput = "";
        updateKeypadDisplay();
    }
};


/* -------------------------------------------------------------------------- */
/* CART LOGIC                               */
/* -------------------------------------------------------------------------- */

 window.addToCart = function(name, price) {
     const existingItem = cart.find(item => item.name === name && item.price === price);
     if (existingItem) {
         existingItem.quantity++;
     } else {
         cart.push({ name, price, id: Date.now(), quantity: 1 });
     }
     updateCartUI();
 };


window.adjustQuantity = function(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
    }
    updateCartUI();
};

window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
};

function clearCart(){
    cart = [];
    amountPaidSoFar = 0;
    remainingDue = 0;
    updateCartUI();
};

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const list = document.getElementById('cart-list');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const subtotalEl = document.getElementById('subtotal-display');
    const taxEl = document.getElementById('tax-display');
    const totalEl = document.getElementById('total-display');
    const chargeBtn = document.getElementById('charge-btn');

    // Update Cart Count
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = totalQuantity;

    if (cart.length === 0) {
        list.innerHTML = '';
        emptyMsg.style.display = 'block';
        transactionTotal = 0;
        transactionSubTotal = 0;
        transactionTaxTotal = 0;
        transactionTipTotal= 0;

    } else {
        emptyMsg.style.display = 'none';
        list.innerHTML = cart.map(item => `
            <li class="list-group-item cart-item d-flex align-items-center justify-content-between">
                <div class="flex-grow-1">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary px-2 py-0 me-2" onclick="adjustQuantity(${item.id}, -1)">-</button>
                    <span class="fw-bold me-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary px-2 py-0 me-2" onclick="adjustQuantity(${item.id}, 1)">+</button>
                    <i class="fa-solid fa-trash-can cart-item-remove ms-2" onclick="removeFromCart(${item.id})"></i>
                </div>
            </li>
        `).join('');
        
        // Calculate Totals
        transactionSubTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        transactionTaxTotal = transactionSubTotal * (appSettings.taxRate / 100);
        transactionTotal = transactionSubTotal + transactionTaxTotal + transactionTipTotal;
    }

    // Update Display
    if (subtotalEl) subtotalEl.innerText = formatCurrency(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    if (taxEl) taxEl.innerText = formatCurrency(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (appSettings.taxRate / 100));
    if (totalEl) totalEl.innerText = formatCurrency(transactionTotal);
    
    if (chargeBtn) {
        chargeBtn.innerText = `Charge ${formatCurrency(transactionTotal)}`;
        chargeBtn.disabled = cart.length === 0;
    }
}

function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

/* -------------------------------------------------------------------------- */
/* PAYMENT LOGIC                               */
/* -------------------------------------------------------------------------- */

function initiatePayment() {
    
    if (appSettings.tipEnabled) 
    {
        showTipModal();
    } 
    else 
    {
        showPaymentModal();
    }
};

function showTipModal() {
    document.getElementById('tip-modal-total').innerText = formatCurrency(transactionTotal);
    
    const container = document.getElementById('tip-buttons-container');
    container.innerHTML = '';
    
    appSettings.tipOptions.forEach(opt => {
        if (opt > 0) {
            let label = "";
            let val = 0;
            
            if (appSettings.tipType === '%') {
                label = `${opt}%`;
                val = transactionTotal * (opt / 100);
            } else {
                label = formatCurrency(opt);
                val = opt;
            }
            
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary btn-lg';
            btn.innerText = label;
            btn.onclick = () => applyTip(val);
            container.appendChild(btn);
        }
    });
    
    // Default Tip Logic (if needed, could auto-select or highlight)
    
    tipModalInstance.show();
}

window.applyTip = function(tipAmount) {
    //transactionTotal += tipAmount;
    transactionTipTotal += tipAmount;
    tipModalInstance.hide();
    showPaymentModal();
};

 function applyCustomTip() {
    const input = document.getElementById('custom-tip-input');
    const val = parseFloat(input.value);
    if (!isNaN(val) && val >= 0) {
        applyTip(val);
        input.value = ''; // Reset
    }
};

function updatePaymentinstruction( instructionText) {
  document.getElementById('payment-instruction').innerText = instructionText;
}
function showPaymentModal() {
    remainingDue = transactionSubTotal + transactionTaxTotal + transactionTipTotal;
    amountPaidSoFar = 0;
    
    // Reset Modal UI
    document.getElementById('modal-amount-due').innerText = formatCurrency(remainingDue);
    document.getElementById('split-payment-alert').classList.add('d-none');
    
    if (window.mt_device_ARQCData != null) 
    {
      updatePaymentinstruction(`Processing ${window.mt_device_ARQCType}`);
    }
    else
    {
      updatePaymentinstruction("Dip/Tap/Swipe/Scan...");
    }
  
    document.getElementById('payment-instruction').classList.remove('text-muted');
    ReadyForSale = true;

    paymentModalInstance.show();
    //mt_Device.sendCommand("AA008104010010018434100182013CA30D8101018201018301038502010084020003861A9C01009F02060000000001009F03060000000000005F2A020840");
    //handleProcessSale();
}

window.cancelTransaction = function() {
    //console.log("Transaction Cancelled");
    if (paymentModalInstance){
      ReadyForSale = false;
      OpeningTill = false;
      paymentModalInstance.hide();
    } 
      
    if (tipModalInstance){
      ReadyForSale = false;
      OpeningTill = false;
      tipModalInstance.hide();
    } 
};

// Listen for Token Redemption from mmsDisplayClaims.js
document.addEventListener('TokenRedeemed', (e) => {
    //console.log('Token Redeemed Event:', e.detail);
    const tokenData = e.detail.token;
    const ownerData = e.detail.owner;
    
    // 1. Extract Balance
    let balance = 0;
    let hasBalanceClaim = false;

    const checkClaims = (claims) => {
        if (!claims) return false;
        //console.log("Checking claims for balance:", claims);

        // Helper to parse currency strings (e.g. "$1,234.56")
        const parseVal = (v) => parseFloat(String(v).replace(/[^0-9.-]+/g, ""));

        // Check for various possible keys for balance
        const keys = ['storedValue', 'balance', 'Balance', 'AccountBalance', 'amount', 'Amount'];
        
        for (const key of keys) {
            if (claims[key] !== undefined && claims[key] !== null) {
                let val = parseVal(claims[key]);
                if (!isNaN(val)) {
                    balance = val;
                    //console.log(`Found balance in '${key}':`, balance);
                    return true;
                }
            }
        }
        return false;
    };

    if (checkClaims(tokenData.claims) || checkClaims(ownerData.claims)) {
        hasBalanceClaim = true;
    }
    
    // 2. Validate Balance
    if (!hasBalanceClaim || isNaN(balance) || balance <= 0.00) {
        alert("Invalid Token: No positive balance found.");
        return;
    }
    
    // 3. Process Payment
    processTokenPayment(balance, ownerData, tokenData);
});

function processTokenPayment(availableFunds, ownerData, tokenData) {
    
    //console.log(`Processing Payment. Total: ${transactionTotal}, Paid: ${amountPaidSoFar}, Due: ${remainingDue}, Available: ${availableFunds}`);

    if (availableFunds >= remainingDue) {
        // SCENARIO A: Sufficient Funds
        const newBalance = availableFunds - remainingDue;
        showReceipt(true, newBalance, ownerData, tokenData);
    } else {
        // SCENARIO B: Insufficient Funds (Split Tender)
        processPartialPayment(availableFunds);
    }
}

function showReceipt(success, remainingTokenBalance, ownerData, tokenData, failureMsg = "", capturedPhoto = null) {
    if (paymentModalInstance){
      ReadyForSale = false;
      paymentModalInstance.hide();
    } 
    
    // Update UI based on Success/Failure
    const iconContainer = document.getElementById('receipt-icon-container');
    const icon = document.getElementById('receipt-icon');
    const title = document.getElementById('receipt-title');
    const msgEl = document.getElementById('receipt-failure-msg');
    const totalEl = document.getElementById('receipt-total');

    if (success) {
        iconContainer.className = "mb-3 text-success";
        icon.className = "fa-regular fa-circle-check fa-4x";
        title.innerText = "Payment Successful";
        msgEl.classList.add('d-none');
        totalEl.innerText = formatCurrency(transactionTotal);
    } else {
        iconContainer.className = "mb-3 text-danger";
        icon.className = "fa-regular fa-circle-xmark fa-4x";
        title.innerText = "Transaction Declined";
        msgEl.innerText = failureMsg;
        msgEl.classList.remove('d-none');
        totalEl.innerText = "$0.00 (Voided)";
    }

    // Update Receipt Balance
    const balanceContainer = document.getElementById('receipt-balance-container');
    if (success) {
        document.getElementById('receipt-balance').innerText = formatCurrency(remainingTokenBalance);
        if (balanceContainer) balanceContainer.classList.remove('d-none');
    } else {
        if (balanceContainer) balanceContainer.classList.add('d-none');
    }
    
    // Update Meta Info (Txn ID, Date)
    const txnId = "TXN-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const dateStr = new Date().toLocaleString();
    const metaEl = document.getElementById('receipt-meta-info');
    metaEl.innerHTML = `
        <div>ID: ${txnId}</div>
        <div>${dateStr}</div>
    `;

    // Update Location
    const locEl = document.getElementById('receipt-location');
    if (currentGeoLocation) {
        locEl.innerText = `Loc: ${currentGeoLocation.latitude.toFixed(5)}, ${currentGeoLocation.longitude.toFixed(5)}`;
    } else {
        locEl.innerText = "";
    }

    // Update Token Info (Token Use & Banner)
    const tokenUseEl = document.getElementById('receipt-token-use');
    const bannerImgEl = document.getElementById('receipt-banner-img');
    
    if (tokenData && tokenData.claims) {
        // Token Use
        const tokenUse = tokenData.claims.TokenUse || tokenData.claims.tokenUse || tokenData.claims.usage || "";
        tokenUseEl.innerText = tokenUse;
        tokenUseEl.style.display = tokenUse ? 'block' : 'none';

        // Banner
        const bannerUrl = tokenData.claims.bannerURL;
        if (success && bannerUrl) {
            bannerImgEl.src = `images/${bannerUrl}.png`;
            bannerImgEl.style.display = 'inline-block';
        } else {
            bannerImgEl.style.display = 'none';
        }
    } else {
        tokenUseEl.style.display = 'none';
        bannerImgEl.style.display = 'none';
    }

    // Update Merchant Info
    const merchantContainer = document.getElementById('receipt-merchant-info');
    let merchantHtml = '';
    if (appSettings.merchantName) merchantHtml += `<h5 class="fw-bold mb-1">${appSettings.merchantName}</h5>`;
    if (appSettings.address1) merchantHtml += `<div>${appSettings.address1}</div>`;
    if (appSettings.address2) merchantHtml += `<div>${appSettings.address2}</div>`;
    if (appSettings.cityStateZip) merchantHtml += `<div>${appSettings.cityStateZip}</div>`;
    if (appSettings.phone) merchantHtml += `<div class="small mt-1">${appSettings.phone}</div>`;
    if (appSettings.website) merchantHtml += `<div class="small">${appSettings.website}</div>`;
    if (appSettings.email) merchantHtml += `<div class="small">${appSettings.email}</div>`;
    
    merchantContainer.innerHTML = merchantHtml;
    if (merchantHtml === '') {
        merchantContainer.classList.add('d-none');
    } else {
        merchantContainer.classList.remove('d-none');
    }

    // Update User Info
    const nameEl = document.getElementById('receipt-user-name');
    const imgEl = document.getElementById('receipt-user-img');
    
    // Reset classes
    imgEl.classList.remove('border-danger');
    imgEl.classList.add('border-white');

    if (success && ownerData) {
        const firstName = ownerData.firstName || "";
        const lastName = ownerData.lastName || "";
        nameEl.innerText = `${firstName} ${lastName}`;
        
        const imgUrl = ownerData.claims ? ownerData.claims.imageURL : null;
        if (imgUrl) {
            imgEl.src = imgUrl;
            imgEl.style.display = 'inline-block';
        } else {
            imgEl.style.display = 'none';
        }
    } else if (!success && capturedPhoto) {
        nameEl.innerText = ""; // Hide owner name
        imgEl.src = capturedPhoto;
        imgEl.style.display = 'inline-block';
        imgEl.classList.remove('border-white');
        imgEl.classList.add('border-danger');
    } else {
        nameEl.innerText = "";
        imgEl.style.display = 'none';
    }

    // Update Payment Breakdown
    const breakdownEl = document.getElementById('receipt-breakdown');
    if (breakdownEl) {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * (appSettings.taxRate / 100);
        // Tip is whatever is left over in transactionTotal
        const tip = Math.max(0, transactionTotal - subtotal - tax);

        breakdownEl.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span>Subtotal</span>
                <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
                <span>Tax (${appSettings.taxRate}%)</span>
                <span>${formatCurrency(tax)}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
                <span>Tip</span>
                <span>${formatCurrency(tip)}</span>
            </div>
        `;
    }

    const receiptModalEl = document.getElementById('receiptModal');
    const receiptModal = new bootstrap.Modal(receiptModalEl);
    
    // Auto-save receipt when modal is fully shown
    receiptModalEl.addEventListener('shown.bs.modal', function onShown() {
        // Remove listener to prevent multiple saves if modal is toggled
        receiptModalEl.removeEventListener('shown.bs.modal', onShown);
        
        // Capture and Save
        html2canvas(document.querySelector('#receiptModal .modal-content')).then(canvas => {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `Receipt_${timestamp}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }).catch(err => console.error("Receipt capture failed:", err));
    });

    receiptModal.show();
}

/* -------------------------------------------------------------------------- */
/* SETTINGS LOGIC                               */
/* -------------------------------------------------------------------------- */

function loadSettings() {
    const stored = localStorage.getItem('posSettings');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle new fields
            appSettings = { ...appSettings, ...parsed };
        } catch (e) {
            console.error("Failed to parse settings", e);
        }
    }
}

window.saveSettings = function() {
    // Gather values from form
    const merchantName = document.getElementById('setting-merchant-name').value;
    const address1 = document.getElementById('setting-merchant-address1').value;
    const address2 = document.getElementById('setting-merchant-address2').value;
    const cityStateZip = document.getElementById('setting-merchant-citystatezip').value;
    const phone = document.getElementById('setting-merchant-phone').value;
    const website = document.getElementById('setting-merchant-website').value;
    const email = document.getElementById('setting-merchant-email').value;
    mt_Utils.saveEncodedValue("MQTTDevice", document.getElementById('setting-mqtt-devpath').value);
    mt_Utils.saveEncodedValue("MPPG_Printer", document.getElementById('setting-mqtt-printpath').value);
    const taxRate = parseFloat(document.getElementById('setting-tax-rate').value) || 0;
    const tipEnabled = document.getElementById('setting-tip-enabled').checked;
    
    let tipType = '%';
    if (document.getElementById('tipTypeDollar').checked) tipType = '$';
    
    const defaultTip = parseFloat(document.getElementById('setting-tip-default').value) || 0;
    
    const tip1 = parseFloat(document.getElementById('setting-tip-1').value) || 0;
    const tip2 = parseFloat(document.getElementById('setting-tip-2').value) || 0;
    const tip3 = parseFloat(document.getElementById('setting-tip-3').value) || 0;
    
    appSettings = {
        merchantName,
        address1,
        address2,
        cityStateZip,
        phone,
        website,
        email,        
        taxRate,
        tipEnabled,
        tipType,
        defaultTip,
        tipOptions: [tip1, tip2, tip3]
    };
    
    localStorage.setItem('posSettings', JSON.stringify(appSettings));
    
    // Update UI
    renderTabs(); // Re-render library with new theme
    updateCartUI();
    
    // Close Modal
    if (settingsModalInstance) {
        settingsModalInstance.hide();
    }
};

function populateSettingsUI() {
    document.getElementById('setting-merchant-name').value = appSettings.merchantName || "";
    document.getElementById('setting-merchant-address1').value = appSettings.address1 || "";
    document.getElementById('setting-merchant-address2').value = appSettings.address2 || "";
    document.getElementById('setting-merchant-citystatezip').value = appSettings.cityStateZip || "";
    document.getElementById('setting-merchant-phone').value = appSettings.phone || "";
    document.getElementById('setting-merchant-website').value = appSettings.website || "";
    document.getElementById('setting-merchant-email').value = appSettings.email || "";
    
    
    document.getElementById('setting-mqtt-devpath').value = mt_Utils.getEncodedValue("MQTTDevice", "");
    document.getElementById('setting-mqtt-printpath').value = mt_Utils.getEncodedValue("MPPG_Printer", "");


    document.getElementById('setting-tax-rate').value = appSettings.taxRate;
    document.getElementById('setting-tip-enabled').checked = appSettings.tipEnabled;
    
    // Trigger change event to update visibility
    const event = new Event('change');
    document.getElementById('setting-tip-enabled').dispatchEvent(event);
    
    if (appSettings.tipType === '$') {
        document.getElementById('tipTypeDollar').checked = true;
    } else {
        document.getElementById('tipTypePercent').checked = true;
    }
    
    document.getElementById('setting-tip-default').value = appSettings.defaultTip;
    
    if (appSettings.tipOptions && appSettings.tipOptions.length >= 3) {
        document.getElementById('setting-tip-1').value = appSettings.tipOptions[0];
        document.getElementById('setting-tip-2').value = appSettings.tipOptions[1];
        document.getElementById('setting-tip-3').value = appSettings.tipOptions[2];
    }
}

function processPartialPayment(fundsValues) {
    amountPaidSoFar += fundsValues;
    remainingDue = transactionTotal - amountPaidSoFar;

    // Update Modal UI for Split Tender
    document.getElementById('modal-amount-due').innerText = formatCurrency(remainingDue);
    
    const alertBox = document.getElementById('split-payment-alert');
    alertBox.classList.remove('d-none');
    
    document.getElementById('split-paid-amount').innerText = formatCurrency(amountPaidSoFar);
    document.getElementById('split-remaining-amount').innerText = formatCurrency(remainingDue);
    
    // Update instruction
    const instruction = document.getElementById('payment-instruction');
    instruction.innerText = "Please use another payment method for the remainder.";
    instruction.classList.add('text-muted');
    
    //console.log(`Partial payment applied: ${fundsValues}. Remaining Due: ${remainingDue}`);
}


// Helper function to show error modal
function showErrorModal(message) {
    const modalBody = document.getElementById('errorModalBody');
    const modalElement = document.getElementById('errorModal');
    if (modalBody && modalElement && window.bootstrap) {
        modalBody.textContent = message;
        const modal = new window.bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error("Bootstrap modal elements or library not found");
    }
}











// Subscribe to  events
EventEmitter.on("OnInputReport", inputReportLogger);
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);

EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);

EventEmitter.on("OnBarcodeDetected", barcodeLogger);
EventEmitter.on("OnBarcodeRead", dataLogger);
EventEmitter.on("OnBarcodeUpdate", barcodeUpdateLogger);

EventEmitter.on("OnARQCData", arqcLogger);
EventEmitter.on("OnBatchData", batchLogger);

EventEmitter.on("OnContactCardDetected", dataLogger);
EventEmitter.on("OnContactPINBlockError", dataLogger);
EventEmitter.on("OnContactPINPadError", dataLogger);

EventEmitter.on("OnContactlessCardCollision", dataLogger);
EventEmitter.on("OnContactlessMifare1KCardDetected", dataLogger);
EventEmitter.on("OnContactlessMifare4KCardDetected", dataLogger);
EventEmitter.on("OnContactlessMifareUltralightCardDetected", dataLogger);
EventEmitter.on("OnContactlessNFCUID", dataLogger);
EventEmitter.on("OnContactlessPINBlockError", dataLogger);
EventEmitter.on("OnContactlessPINPadError", dataLogger);
EventEmitter.on("OnContactlessVASError", dataLogger);

EventEmitter.on("OnFirmwareUpdateFailed", dataLogger);
EventEmitter.on("OnFirmwareUpdateSuccessful", dataLogger);
EventEmitter.on("OnFirmwareUptoDate", dataLogger);

EventEmitter.on("OnManualDataEntered", dataLogger);

EventEmitter.on("OnMSRCardDetected", dataLogger);
EventEmitter.on("OnMSRCardInserted", dataLogger);
EventEmitter.on("OnMSRCardRemoved", dataLogger);
EventEmitter.on("OnMSRCardSwiped", dataLogger);

EventEmitter.on("OnPowerEvent", dataLogger);

EventEmitter.on("OnTransactionComplete", trxCompleteLogger);
EventEmitter.on("OnTransactionHostAction", dataLogger);

EventEmitter.on("OnUIHostActionComplete", dataLogger);
EventEmitter.on("OnUIHostActionRequest", dataLogger);
EventEmitter.on("OnUIInformationUpdate", dataLogger);

EventEmitter.on("OnUserEvent", userEventLogger);

EventEmitter.on("OnContactlessCardDetected", contactlessCardDetectedLogger);
EventEmitter.on("OnContactlessCardRemoved", contactlessCardRemovedLogger);
EventEmitter.on("OnContactCardInserted", contactCardInsertedLogger);
EventEmitter.on("OnContactCardRemoved", contactCardRemovedLogger);
EventEmitter.on("OnMSRSwipeDetected", msrSwipeDetectedLogger);

EventEmitter.on("OnDeviceResponse", fromDeviceLogger);
EventEmitter.on("OnTouchDown", touchDownLogger);
EventEmitter.on("OnTouchUp", touchUpLogger);

EventEmitter.on("OnError", errorLogger);
EventEmitter.on("OnPINComplete", PINLogger);
EventEmitter.on("OnUIDisplayMessage", displayMessageLogger);
EventEmitter.on("OnDebug", debugLogger);
EventEmitter.on("OnMQTTStatus", mqttStatus);