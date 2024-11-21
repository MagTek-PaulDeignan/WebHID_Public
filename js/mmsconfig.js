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

import * as mt_Utils from "./mt_utils.js";
import * as mt_MMS from "./mt_mms.js";
import * as mt_HID from "./mt_hid.js";
import * as mt_UI from "./mt_ui.js";
import "./mt_events.js";

let _contactSeated = false;
let _AwaitingContactEMV = false;
export let _contactlessDelay = parseInt(mt_Utils.getDefaultValue("ContactlessDelay", "500"));
export let _openTimeDelay = 1500;



document
  .querySelector("#getDeviceIP")
  .addEventListener("click", getDeviceIP);

document
  .querySelector("#getDeviceName")
  .addEventListener("click", getDeviceName);

document
  .querySelector("#getSSID")
  .addEventListener("click", getSSID);
document
  .querySelector("#setSSID")
  .addEventListener("click", setSSID);
document
  .querySelector("#setSSIDPwd")
  .addEventListener("click", setSSIDPassword);
document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);
document
  .querySelector("#sendCommand")
  .addEventListener("click", handleSendCommandButton);
document
  .querySelector("#clearCommand")
  .addEventListener("click", handleClearButton);
document
  .querySelector("#CommandList")
  .addEventListener("change", mt_UI.FromListToText);
document.addEventListener("DOMContentLoaded", handleDOMLoaded);

document
  .querySelector("#loadTLS")
  .addEventListener("click", LoadTLS);

document
  .querySelector("#loadNoTLS")
  .addEventListener("click", LoadNoTLS);

  document
  .querySelector("#ResetDevice")
  .addEventListener("click", ResetDevice);

  function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};
async function getAddressMode(){

  mt_UI.LogData("Getting Wireless Address Mode...");
  let Resp = await mt_MMS.sendCommand("AA0081040116D101841AD10181072B06010401F609850101890AE208E206E104E102C500");
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("wirelessAddressMode",mt_Utils.getTagValue("C3","",Tag84.substring(48),false));
  }
}
async function setAddressMode(){
  mt_UI.LogData("Setting Wireless Address Mode DHCP ...");
  let Resp = await mt_MMS.sendCommand("AA0081040117D111841ED11181072B06010401F609850101890EE20CE20AE108E106C50400000001");
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("wirelessAddressMode",mt_Utils.getTagValue("C3","",Tag84.substring(48),false));
  }
}

async function getWireLessSecurityMode(){

  mt_UI.LogData("Getting Wireless Security Mode...");
  let Resp = await mt_MMS.sendCommand("AA0081040113D101841AD10181072B06010401F609850101890AE208E206E104E102C300");
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("wirelessSecurityMode",mt_Utils.getTagValue("C3","",Tag84.substring(48),false));
  }
}
async function setWireLessSecurityPSKMode(){
  mt_UI.LogData("Setting Wireless Security PSK Mode...");
  let Resp = await mt_MMS.sendCommand("AA0081040114D111841BD11181072B06010401F609850101890BE209E207E105E103C30100");  
}

async function getDeviceIP(){
  mt_UI.LogData("Getting Device DHCP Address...");
  let Resp = await mt_MMS.sendCommand("AA008104010ED101841AD10181072B06010401F609850102890AE108E206E504E602C300");
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("deviceIP",mt_Utils.hexToDecIPv4(mt_Utils.getTagValue("C3","",Tag84.substring(48),false)));
  }

}
async function getCSR() {
  //mt_UI.LogData("Generating CSR...");
  //let Resp = await mt_MMS.sendCommand("AA0081040106D821840BD821810404000000870101");
  //mt_UI.LogData(JSON.stringify(Resp));
  //await  mt_Utils.wait(500);
  //Resp = await mt_MMS.sendCommand("AA0081040107EF038405EF03810100");
  //mt_UI.LogData(JSON.stringify(Resp));
  //await mt_Utils.wait(2000);
  //Resp = await mt_MMS.sendCommand("AA0081040108D821840BD821810404000000870101");
  //mt_UI.LogData(JSON.stringify(Resp));
  //await mt_Utils.wait(1000);
  //mt_UI.LogData("Generating CSR... DONE");
}

async function LoadTLS(){
  mt_UI.LogData("Loading TLS Trust Config...");
  let Resp = await mt_MMS.sendCommand("AA0081040115D8128444D812810405000000A22B8104000007A08201048320AE8C6BEEB77C5820BA0CBAFDAB656D20007B1262A7E17F7F2FF89D320468AF4FA30A81083035303030303030870101");
  //mt_UI.LogData(JSON.stringify(Resp));
  await  mt_Utils.wait(500);
  Resp = await mt_MMS.sendCommand("AA0081080400D81205000000848207A04D47544B41503130C10405000000830101850102A78207408182073C2D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0D0A4D4949434E444343416475674177494241674955515A7954704E566845356B6E532F73414F49456B7247626574356F77436759494B6F5A497A6A3045417749770D0A6144454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A7561574578457A415242674E5642416F4D436B31680D0A5A31526C6179424A626D4D78476A415942674E564241734D455546776232787362794251636D396B64574E30615739754D524D774551594456515144444170530D0A62323930494552474D6930784D4234584454497A4D4467774D7A49784D5441774E6C6F584454517A4D4463794F5449784D5441774E6C6F776144454C4D416B470D0A4131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A7561574578457A415242674E5642416F4D436B31685A31526C6179424A0D0A626D4D78476A415942674E564241734D455546776232787362794251636D396B64574E30615739754D524D7745515944565151444441705362323930494552470D0A4D6930784D466B77457759484B6F5A497A6A3043415159494B6F5A497A6A304441516344516741455254374E6B597A716B732F426273734D3276646963636F630D0A64622F41515A6271454A624677712F6F4847664E784939673175536A5542612F596D76614E317376794E2B784A76556142634D6A75394B443973334946364E6A0D0A4D474577485159445652304F4242594546465A525A2F316846693542575872734568625A53334C4E5A7861704D42384741315564497751594D42614146465A520D0A5A2F316846693542575872734568625A53334C4E5A7861704D41384741315564457745422F7751464D414D424166387744675944565230504151482F424151440D0A416747474D416F4743437147534D343942414D43413063414D45514349464855515544434263773233576754787566713649594972424176534C584C61712B5A0D0A77374877434C4E544169416B34596C76696B774867784B55437071616874775954515537706351766C304763366F3463476D6D5346513D3D0D0A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0D0A2D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0D0A4D49494373444343416C656741774942416749554B34625A7537566532656847786158736935382F3778594569305577436759494B6F5A497A6A3045417749770D0A6144454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A7561574578457A415242674E5642416F4D436B31680D0A5A31526C6179424A626D4D78476A415942674E564241734D455546776232787362794251636D396B64574E30615739754D524D774551594456515144444170530D0A62323930494552474D6930784D4234584454497A4D4467774D7A49784D5441774E6C6F5844544D344D44637A4D4449784D5441774E6C6F776154454C4D416B470D0A4131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A7561574578457A415242674E5642416F4D436B31685A31526C6179424A0D0A626D4D78476A415942674E564241734D455546776232787362794251636D396B64574E30615739754D52517745675944565151444441745464574A44515342450D0A526A49744D54425A4D424D4742797147534D34394167454743437147534D34394177454841304941424A4254507439726F775437494B4D636D53415648536C660D0A54352F41414566366D6662773833765433674E7859512F494E694D5462654A4850436F49736450716341747756396F4954744B514650446D63303557566B2B6A0D0A6764307767646F77485159445652304F42425945464A522F5A354663554E33524B687442692B487870715269533665484D42384741315564497751594D4261410D0A46465A525A2F316846693542575872734568625A53334C4E5A7861704D42494741315564457745422F7751494D415942416638434151417744675944565230500D0A4151482F42415144416747474D423047413155644A5151574D425147434373474151554642774D42426767724267454642516344416A425642674E56485341450D0A546A424D4D456F474246556449414177516A4241426767724267454642516343416A41304D424557436B31685A31526C6179424A626D4D774177494241526F660D0A566D4673615751675A6D397949455235626D46476247563449456C4A4946644D51553467623235736554414B42676771686B6A4F5051514441674E48414442450D0A4169414B346E6D4833546E752F766345714B7437324F4B6167506C4E36344172786C5A394C585A6975596E4461414967545269537947686362573650555931680D0A6F49387946482B7A39596874663767314E335A6F797347676339343D0D0A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0D0A0D0ACC46304402201F397C0039DC85EF1A4AD959823D5FF44696EC818944D977EF225698F431998902204E9CF79ECE56994462653831C96B07D919FA534C4A7D11E791114235633A46E9");
  //mt_UI.LogData(JSON.stringify(Resp));
  await mt_Utils.wait(500);
  mt_UI.LogData("Loading TLS Trust Config... DONE");
}

async function LoadNoTLS(){
  mt_UI.LogData("Loading No TLS Trust Config...");
  let Resp = await mt_MMS.sendCommand("AA008104011DD8128444D812810405000000A22B8104000009FB82010483207B9FF28F48957EBE2E3B9F9C980CFCF3F50F56B8F646A66B6B8A57C508D10C95A30A81083035303030303030870101");
  //mt_UI.LogData(JSON.stringify(Resp));
  await  mt_Utils.wait(500);
  Resp = await mt_MMS.sendCommand("AA0081080400D81205000000848209FB4D47544B41503130C10405000000830102850100A7820999818206BB2D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0D0A4D494943436A43434162476741774942416749554F6E6C4C6B3472354365497A32773841704845614E4D343641746F77436759494B6F5A497A6A3045417749770D0A557A454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A75615745784654415442674E5642416F4D4445466A0D0A6257556756326C6B5A325630637A45594D425947413155454177775051574E745A534245526A4967556D3976644341784D423458445449304D446B784E6A45320D0A4E546B7A4D566F58445451304D446B784D5445324E546B7A4D566F77557A454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E680D0A62476C6D62334A75615745784654415442674E5642416F4D4445466A6257556756326C6B5A325630637A45594D425947413155454177775051574E745A5342450D0A526A4967556D3976644341784D466B77457759484B6F5A497A6A3043415159494B6F5A497A6A3044415163445167414537514650704372617155754755315A390D0A4E2B4636453567665958516D78556C364B79464D5251316A775070467A4E376F3961575866774A734B59664C5766336E5144596139757642567A6B75426158590D0A4A3055726C714E6A4D474577485159445652304F4242594546426433597A56396363372F554956307A46657A41514733426B5A4B4D42384741315564497751590D0A4D42614146426433597A56396363372F554956307A46657A41514733426B5A4B4D41384741315564457745422F7751464D414D424166387744675944565230500D0A4151482F42415144416747474D416F4743437147534D343942414D43413063414D455143494139764E66507032364835773747724933697A38333259753244540D0A6870786C525773696E644D714232637A4169426D76776C6B57786767562F57527031366561353377514E6F6B302F6D75665479755553504A38306D656D513D3D0D0A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0D0A2D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0D0A4D4949436654434341694F67417749424167495562797079324F6A366364717262504D76336677396A744A4D332F7777436759494B6F5A497A6A3045417749770D0A557A454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A75615745784654415442674E5642416F4D4445466A0D0A6257556756326C6B5A325630637A45594D425947413155454177775051574E745A534245526A4967556D3976644341784D423458445449304D446B784E6A45320D0A4E546B7A4D566F5844544D354D446B784D7A45324E546B7A4D566F77556A454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E680D0A62476C6D62334A75615745784654415442674E5642416F4D4445466A6257556756326C6B5A325630637A45584D425547413155454177774F51574E745A5342450D0A526A496755335669494445775754415442676371686B6A4F5051494242676771686B6A4F50514D4242774E4341415444354B364175527A2F77794C4D645031780D0A7039744F484C487344375865702F3973626877436B774B58354636785A58765954756143324D544A314A584E2B386B6F2F5444514858614C436A66716F382B740D0A4A6A306C6F3448564D4948534D42304741315564446751574242516B376458416D732F2F5648596574596E4E7568397A736E4E5A7754415342674E5648524D420D0A41663845434441474151482F416745414D41344741315564447745422F77514541774942686A416442674E5648535545466A41554267677242674546425163440D0A415159494B77594242515548417749775451594456523067424559775244424342675256485341414D446F774F4159494B77594242515548416749774C4441520D0A4667704E595764555A5773675357356A4D414D434151456146315A6862476C6B49475A7663694245526A49675630784254694276626D78354D423847413155640D0A497751594D42614146426433597A56396363372F554956307A46657A41514733426B5A4B4D416F4743437147534D343942414D43413067414D455543494458680D0A4C4C786E59524E764D4A4D586B4F306370344C743471677253475165476D6B3967593366686F724C416945416B4E2B654B4E4C49564C446568775778646E61620D0A64586B4C7A4B6533677855416334566B576A73666469303D0D0A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0D0A1A838202D62D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0D0A4D494942345443434159696741774942416749555349615363694467566E75446B6E736F506D6F7971774B6970396F77436759494B6F5A497A6A3045417749770D0A556A454C4D416B474131554542684D4356564D78457A415242674E564241674D436B4E6862476C6D62334A75615745784654415442674E5642416F4D4445466A0D0A6257556756326C6B5A325630637A45584D425547413155454177774F51574E745A534245526A496755335669494445774868634E4D6A51774F5445324D5459310D0A4F544D785768634E4D7A6B774F54457A4D5459314F544D78576A41304D525577457759445651514B444178425932316C494664705A47646C64484D78477A415A0D0A42674E5642414D4D456B466A625755675245597949464E705A323570626D63674D54425A4D424D4742797147534D34394167454743437147534D3439417745480D0A413049414242544C37514A44695962666A2F3050484E4D64437775715A6261614141594162544E34486F4E752F75645A524B6E49646245495378756F7852356C0D0A67305A577769394D414F3432426E347577673033326648337A616D6A576A42594D4230474131556444675157424254495A71346A4F5873514C504D79614C2F560D0A36766F2B48384F32316A414A42674E5648524D45416A41414D4173474131556444775145417749456B44416642674E5648534D45474441576742516B376458410D0A6D732F2F5648596574596E4E7568397A736E4E5A7754414B42676771686B6A4F5051514441674E4841444245416942332B716E4E4557383434474441677265620D0A564267614A4741376D51554D3577314F4342334E4158766F6451496751496D2F2B586A57444F4A4D567367774741494C764B41323968554B4F46794C636A656A0D0A7A5A35533445513D0D0A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0D0ACC483046022100F924DE9B39C1862B7D64149D5AA87246D1DCFCD1D5FA5638BC67C271C8A7B061022100E4DC22B7A5A3F388403A5F43D131748B03E14B028ED60B89B0834C8032C7B7FC");
  //mt_UI.LogData(JSON.stringify(Resp));
  await mt_Utils.wait(500);
  mt_UI.LogData("Loading No TLS Trust Config... DONE");
}

async function ResetDevice(){
  mt_UI.LogData("Resetting Device...");
  let Resp = await mt_MMS.sendCommand("AA00810401121F0184021F01"); 
}

async function getSSID() {
  mt_UI.LogData("Getting SSID");
  let Resp = await mt_MMS.sendCommand("AA0081040112D101841AD10181072B06010401F609850101890AE208E206E104E102C100");  
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("ssidName",mt_Utils.getTagValue("C1","",Tag84.substring(48),true));
  }
}

async function setSSID() {
  let name = mt_UI.GetValue("ssidName");
  let val = mt_Utils.AsciiToHexPad(name, 0x20);
  
  //Set to DHCP
    mt_UI.LogData("Setting DHCP Mode");
    let Resp = await mt_MMS.sendCommand("AA0081040117D111841ED11181072B06010401F609850101890EE20CE20AE108E106C50400000001");
    mt_UI.LogData("Setting SSID");
    Resp = await mt_MMS.sendCommand(`AA0081040107D111843AD11181072B06010401F609850101892AE228E226E124E122C120${val}`);
}

async function setSSIDPassword() {
  let name = mt_UI.GetValue("ssidPwd");
  let val = mt_Utils.AsciiToHexPad(name, 0x3F);
  mt_UI.LogData("Setting Wireless Password");
  let Resp = await mt_MMS.sendCommand(`AA0081040107D1118459D11181072B06010401F6098501018949E247E245E143E141C23F${val}`);
}

async function getDeviceName() {
  mt_UI.LogData("Getting Device Name");
  let Resp = await mt_MMS.sendCommand("AA0081040125D101841AD10181072B06010401F609850101890AE208E206E104E102C800");  
  let Tag82 = mt_Utils.getTagValue("82","",Resp.TLVData);
  if(Tag82 == "00000000")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    mt_UI.UpdateValue("deviceName",mt_Utils.getTagValue("C8","",Tag84.substring(48),true));
  }
}



async function handleDOMLoaded() {
  let devices = await mt_HID.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });



  //Add the hid event listener for connect/plug in
  navigator.hid.addEventListener("connect", async ({ device }) => {
    EmitObject({Name:"OnDeviceConnect", Device:device});
    if (mt_MMS.wasOpened) {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }
  });

  //Add the hid event listener for disconnect/unplug
  navigator.hid.addEventListener("disconnect", ({ device }) => {
    EmitObject({Name:"OnDeviceDisconnect", Device:device});
  });
}



async function handleCloseButton() {
  mt_MMS.closeDevice();
  mt_UI.ClearLog();
}
async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  mt_UI.UpdateValue("deviceName","");
  mt_UI.UpdateValue("deviceIP","");
  mt_UI.UpdateValue("ssidName","");
  mt_UI.UpdateValue("ssidPwd","");
}

async function handleOpenButton() {
  window._device = await mt_MMS.openDevice();
}

async function handleSendCommandButton() {
  const data = document.getElementById("sendData");
  await parseCommand(data.value);
}

async function parseCommand(message) {
  let Response;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":
      mt_Utils.debugLog("GETAPPVERSION " + appOptions.version);      
      break;
    case "GETDEVINFO":
      mt_Utils.debugLog("GETDEVINFO " + getDeviceInfo());      
      break;
    case "SENDCOMMAND":
      Response = await mt_MMS.sendCommand(cmd[1]);
      EmitObject({ Name: "OnDeviceResponse", Data: Response });
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":
      window._device = await mt_MMS.openDevice();      
      break;
    case "CLOSEDEVICE":
      await mt_MMS.closeDevice();
      break;
    case "WAIT":
      wait(cmd[1]);
      break;
    case "DETECTDEVICE":
      window._device = await mt_MMS.openDevice();      
      break;
    case "GETTAGVALUE":
      let asAscii = (cmd[4] === 'true');
      var retval = mt_Utils.getTagValue(cmd[1], cmd[2], cmd[3], asAscii);      
      mt_UI.LogData(retval);
      break;
    case "PARSETLV":
      var retval = mt_Utils.tlvParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    default:
      mt_Utils.debugLog("Unknown Command");
  }
};

function ClearAutoCheck() {
  var chk = document.getElementById("chk-AutoStart");
  chk.checked = false;
}

const deviceConnectLogger = (e) => {
  mt_UI.setUSBConnected("Connected");
};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
};
const deviceOpenLogger = (e) => {
  mt_UI.setUSBConnected("Opened");
};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};
const PINLogger = (e) => {
  mt_UI.LogData(`${e.Name}: EPB:${e.Data.EPB} KSN:${e.Data.KSN} Encryption Type:${e.Data.EncType} PIN Block Format: ${e.Data.PBF} TLV: ${e.Data.TLV}`);
};

const trxCompleteLogger = (e) => {
  mt_UI.LogData(`${e.Name}: ${e.Data}`);
};
const displayMessageLogger = (e) => {
  mt_UI.LogData(`Display: ${e.Data}`);
  mt_UI.DeviceDisplay(e.Data);
};
const barcodeLogger = (e) => {
  //mt_UI.LogData(`Barcode  Data: ${e.Data}`);
  mt_UI.LogData(`Barcode  Data: ${mt_Utils.getTagValue("DF74", "", e.Data, true)}`);
};
const arqcLogger = (e) => {
  mt_UI.LogData(`${e.Source} ARQC Data:  ${e.Data}`);
  let TLVs = mt_Utils.tlvParser(e.Data.substring(4));
   mt_UI.LogData("TLVs---------------------------------");
   TLVs.forEach(element => {
     mt_UI.LogData(`${element.tag} : ${element.tagValue} `);    
   });   
    mt_UI.LogData("TLVs---------------------------------");
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};
const fromDeviceLogger = (e) => {
  mt_UI.LogData(`Device Response: ${e.Data.HexString}`);
};
const inputReportLogger = (e) => {
  mt_UI.LogData(`Input Report: ${e.Data}`);
};
const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const debugLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const touchUpLogger = (e) => {
  var chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Up: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};
const touchDownLogger = (e) => {
  var chk = document.getElementById("chk-AutoTouch");
  if (chk.checked) {
    mt_UI.LogData(`Touch Down: X: ${e.Data.Xpos} Y: ${e.Data.Ypos}`);
  }
};
const contactlessCardDetectedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Detected`);
  var chk = document.getElementById("chk-AutoNFC");
  var chkEMV = document.getElementById("chk-AutoEMV");  
  var _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting...`);
    if (chkEMV.checked) {
      _AwaitingContactEMV = true;
      mt_UI.LogData(`Delaying Contactless ${_contactlessDelay}ms`);
      await mt_Utils.wait(_contactlessDelay);
    }
    if (!_contactSeated) {
      // We didn't get a contact seated, do start the contactless transaction
      mt_MMS.sendCommand(
        "AA008104010010018430100182010AA30981010082010083010184020003861A9C01009F02060000000001009F03060000000000005F2A020840"
      );
    }
  }
};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = (e) => {
  _contactSeated = true;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);
  var chk = document.getElementById("chk-AutoEMV");
  var _autoStart = document.getElementById("chk-AutoStart");
  if (
    _autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle") ||
    _AwaitingContactEMV
  ) {
    _AwaitingContactEMV = false;
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting EMV...`);
    mt_MMS.sendCommand(
      "AA008104010010018430100182010AA30981010082010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840"
    );
  }
};

const contactCardRemovedLogger = (e) => {
  _contactSeated = false;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Removed`);
};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected ${e.Data}`);
  var chk = document.getElementById("chk-AutoMSR");
  var _autoStart = document.getElementById("chk-AutoStart");
  if (_autoStart.checked & chk.checked & (e.Data.toLowerCase() == "idle")) {
    ClearAutoCheck();
    mt_UI.LogData(`Auto Starting MSR...`);
    mt_MMS.sendCommand(
      "AA008104010010018430100182010AA30981010182010183010084020003861A9C01009F02060000000001009F03060000000000005F2A020840"
    );
  }
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const fileLogger = (e) => {
  mt_UI.LogData(`File: ${e.Data.HexString}`);
};


// Subscribe to  events
EventEmitter.on("OnInputReport", inputReportLogger);
EventEmitter.on("OnDeviceConnect", deviceConnectLogger);
EventEmitter.on("OnDeviceDisconnect", deviceDisconnectLogger);

EventEmitter.on("OnDeviceOpen", deviceOpenLogger);
EventEmitter.on("OnDeviceClose", deviceCloseLogger);

EventEmitter.on("OnBarcodeDetected", barcodeLogger);
EventEmitter.on("OnBarcodeRead", dataLogger);
EventEmitter.on("OnBarcodeUpdate", dataLogger);

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

EventEmitter.on("OnFileFromHost", fileLogger);
EventEmitter.on("OnFileFromDevice", fileLogger);
