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

import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";
import * as mt_UI from "./mt_ui.js";
import * as mt_Unigate from "./MagTek_WebAPI/API_Unigate.js";





document
   .querySelector("#ProcessSale")
   .addEventListener("click", handleProcessSale);

document
   .querySelector("#loadSampleData")
   .addEventListener("click", handleLoadSampleData);

document
   .querySelector("#Clear")
   .addEventListener("click", handleClear);

document
   .querySelector("#saveCredentials")
   .addEventListener("click", handleSave);

document.addEventListener("DOMContentLoaded", handleDOMLoaded);

async function handleClear(){
  document.getElementById("LogData").value = "";
}

async function handleDOMLoaded() {
  document.getElementById("custCode").value= mt_Utils.getEncodedValue("Unigate_CustCode", "S1Q0NDc0NjI2NA==");
  document.getElementById("userName").value= mt_Utils.getEncodedValue("Unigate_UserName", "VFNZU1BpbG90UFJPRA==");
  document.getElementById("password").value= mt_Utils.getEncodedValue("Unigate_Password", "UGFzc3dvcmQjMTIzNDU=");
  document.getElementById("processorName").value = mt_Utils.getEncodedValue("Unigate_ProcessorName", "VFNZUyAtIFBJTE9U");  
}

async function handleSave() {
  let item = document.getElementById("userName");
  mt_Utils.saveEncodedValue("Unigate_UserName", item.value);

  item = document.getElementById("password");
  mt_Utils.saveEncodedValue("Unigate_Password", item.value);

  item = document.getElementById("custCode");
  mt_Utils.saveEncodedValue("Unigate_CustCode", item.value);

  item = document.getElementById("processorName");
  mt_Utils.saveEncodedValue("Unigate_ProcessorName", item.value);

  item = document.getElementById("LogData");
  item.innerText = "Values saved"  

}

async function handleLoadSampleData() {
  document.getElementById("transactionType").value = "SALE";
  document.getElementById("saleAmount").value = "1.23";
  document.getElementById("arqc").value = "01B7F98201B3DFDF540A9070020B571AF20000A8DFDF550182DFDF250742353731414632FA8201917082018D820219809F6E0708400000303000DFDF530100DFDF4D273B353331323537303030323030383131323D30303030303030303030303030303030303030303FDFDF520106F8820146DFDF59820128A17230ACD043954949A084A1B99F68AC0CC69B96940ED20300C873B4DF45A2E96AA04D7E3506C578711B295B3B031ECE6E0EBE01D3605BF33CC6FD9218846E7A8B15F8F94AC66895064CA27F89FCC815709293D8028480E626B1172493F8591AD34BDA1CB2032A41785E32695F96793BC03043CDB9708B8D405600D07402271ACBCB59DE4366CA884B0F5C100046FABADDE82867C198BB29810BF0CF637B3B2304757F9A4F1D2B5009B26BD601A33D4C435B287673DEFD43B87BA2F78D8BEC4B49ADD22908036289A468D0C5DC8058F8DB37D738DCC376EBEF503F50F5B235E91A0AA83B4842ECAB2FE3D43BEEE0C22D1417026DD9138B5DFE5EA8D8D7670DDA52F8F9B1374908E1B8C1A3E5161D597151AA812E215420B7D945C4C644A347AF5EB52BAD8ED568C2DFDF560A9070020B571AF20000A8DFDF570180DFDF58010200000000000000F9D4AEE8";
};


async function handleProcessSale() {
  let custCode = document.getElementById("custCode").value
  let username = document.getElementById("userName").value
  let password = document.getElementById("password").value
  let processorName = document.getElementById("processorName").value
  let transactionType = document.getElementById("transactionType").value
  let saleAmount = document.getElementById("saleAmount").value;
  let arqc = document.getElementById("arqc").value;

  mt_Unigate.setUsername(username);
  mt_Unigate.setPassword(password);
  mt_Unigate.setCustCode(custCode);
  mt_Unigate.setProcessorName(processorName);

  let BasicAuth = mt_Unigate.getBasicAuth();
  


  if (arqc != null)
   {
          let Amount = {
            SubTotal: 0,
            Tax: 0,
            Tip: 0,
            CashBack:0
          }

          if(saleAmount.length > 0) Amount.SubTotal = parseFloat(saleAmount);
    
            let saleResp = await mt_Unigate.ProcessARQCTransaction(Amount, arqc, undefined, transactionType, "Credit", true);  

            if(!saleResp.status.ok){
              mt_UI.LogData(`Authorization: ${BasicAuth}`);
              mt_UI.LogData(``);
              mt_UI.LogData(`====================== ${transactionType} Response Failure Details ======================`);
              mt_UI.LogData(JSON.stringify(saleResp, null, 2));
              mt_UI.LogData(`====================== ${transactionType} Response Failure  Details ======================`);                
              return;
            }
            mt_UI.LogData(`Authorization: ${BasicAuth}`);
            mt_UI.LogData(``);
            mt_UI.LogData(`====================== ${transactionType} Response Details ======================`);
            mt_UI.LogData(JSON.stringify(saleResp.data, null, 2));
            mt_UI.LogData(`====================== ${transactionType} Response Details ======================`);                

                if(mt_Utils.getObjectKeyLen(saleResp.Details) > 0)                
                  {
                    mt_UI.LogData(``);
                    mt_UI.LogData(`===================== Processor Response KVPs =====================`);
                    for (var key in saleResp.Details) {
                      if (saleResp.Details.hasOwnProperty(key))
                        {
                         
                         
                          mt_UI.LogData(`${key}: ${saleResp.Details[key]}` );
                        }
                    }
                    mt_UI.LogData(`====================== Processor Response KVPs ======================`);
                  }


                  //mt_UI.LogData(``);
                  //let Outdata = saleResp.Details.customerReceipt.replace(/\\n/g, '\n');
                  //mt_UI.LogData(`============================Receipt=============================`);
                  //mt_UI.LogData(`${Outdata}`);
                  //mt_UI.LogData(`============================Receipt============================`);
   } 
   else 
   {
     mt_UI.LogData(`No ARQC Available`);
   }
 }


