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
import * as mt_CertMgr from "./MagTek_WebAPI/API_CertificateManager.js"
import "./MagTek_WebAPI/mt_events.js";

import DeviceFactory from "./MagTek_WebAPI/device/API_device_factory.js";
let mt_MMS = DeviceFactory.getDevice("MMS_HID");


let retval = "";
let _contactSeated = false;
let _AwaitingContactEMV = false;
export let _contactlessDelay = parseInt(mt_Utils.getEncodedValue("ContactlessDelay", "500"));
export let _openTimeDelay = 1500;
let CertExpirationWarningDays = 30;
let CertExpirationDays = 396;
//let CertExpirationDays = 20;
let fwID = null;

mt_CertMgr.setURL("https://rms.magensa.net/Qwantum/CertificateManager");
mt_CertMgr.setWebAPIKey("MTSandbox-F0FA3140-1E50-4331-8BB9-F33BF9CB32FB");
mt_CertMgr.setProfile("SandBox");

let ShowDeviceResponses = true;


document
  .querySelector("#setConfig")
  .addEventListener("click", setConfig);

document
  .querySelector("#deviceOpen")
  .addEventListener("click", handleOpenButton);
document
  .querySelector("#deviceClose")
  .addEventListener("click", handleCloseButton);

document
  .querySelector("#clearCommand")
  .addEventListener("click", handleClearButton);

document.addEventListener("DOMContentLoaded", handleDOMLoaded);

document
  .querySelector("#ResetDevice")
  .addEventListener("click", ResetDevice);

function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};


async function getConfig() {
  mt_UI.updateProgressBar("",-1);  
  ShowDeviceResponses = false;
  mt_UI.LogData(`Getting MQTT Configuration`);
  await getWirelessSecurityMode();
  await getAddressMode();
  await getWLANMode();
  await getDeviceName();
  await getDeviceIP();
  await getSSID();
  await getMQTTBroker();
  await getMQTTPort();
  await getMQTTUser();
  
  let item = document.getElementById("mqttOrg");
  item.value = mt_Utils.getEncodedValue("MQTTOrg", "TWFnVGVrLw==");


  await getMQTTSubTopic();
  await getMQTTPubTopic();
  mt_UI.LogData(`Done - Getting MQTT Configuration`);
  mt_UI.LogData("");
  ShowDeviceResponses = true;
}

async function setConfig()
{
  ShowDeviceResponses = false;
  mt_UI.LogData(`Saving MQTT Configuration`);
  await setWirelessSecurityMode();
  await setAddressMode();
  await setWLANMode("00");
  await setSSID();
  await setMQTTTrustConfig();  
  await setMQTTBroker("developer.deignan.com");
  await setMQTTUser();
  await setMQTTPassword();

  let item = document.getElementById("mqttOrg");
  mt_Utils.saveEncodedValue("MQTTOrg", item.value);

  await setMQTTSubTopic();
  await setMQTTPubTopic();
  mt_UI.LogData(`Done - Saving MQTT Configuration`);
  mt_UI.LogData("");
  ShowDeviceResponses = true;
  
}

async function setMQTTTrustConfig(){

  let fw = await mt_MMS.GetDeviceFWID();
  let fwpart = fw.split("-");
  let fwType = fwpart[fwpart.length -1];
  let Resp = null;
  ShowDeviceResponses = true;
  switch (fwType) {
    case "PRD":
      mt_UI.LogData(`Setting Root Certificate and Trust Config for PRD Device`);
      Resp = await mt_MMS.sendCommand("AA008104010CD8128444D812810405000100A22B81040000089482010483200605186326F3D990235139B1653A29C69C49878D8E23D9DABFA3A32E1ED2F0A0A30A81083035303030313030870101");
      Resp = await mt_MMS.sendCommand("AA0081080400D81205000100848208944D47544B41503130C10405000100830100850102A78208328182082E2D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0A4D494946336A4343413861674177494241674951416631744D50796A796C476F4737786B446A55444C54414E42676B71686B69473977304241517746414443420A6944454C4D416B474131554542684D4356564D78457A415242674E5642416754436B356C6479424B5A584A7A5A586B784644415342674E56424163544330706C0A636E4E6C65534244615852354D523477484159445651514B457856556147556756564E46556C525356564E554945356C64486476636D73784C6A417342674E560A42414D544A56565452564A55636E567A64434253553045675132567964476C6D61574E6864476C76626942426458526F62334A7064486B774868634E4D5441770A4D6A41784D4441774D4441775768634E4D7A67774D5445344D6A4D314F545535576A43426944454C4D416B474131554542684D4356564D78457A415242674E560A42416754436B356C6479424B5A584A7A5A586B784644415342674E56424163544330706C636E4E6C65534244615852354D523477484159445651514B457856550A6147556756564E46556C525356564E554945356C64486476636D73784C6A417342674E5642414D544A56565452564A55636E567A6443425355304567513256790A64476C6D61574E6864476C76626942426458526F62334A7064486B77676749694D4130474353714753496233445145424151554141344943447741776767494B0A416F494341514341456D55584E6737443277697A304B7858445862747A536654544B3151673248697169424E4353316B43647A4F695A2F4D50616E7339732F420A3350485473645A374E7967524B3066614F6361384F686D3058366139665A326A59304B3264764B704F7975522B4F4A76304F7757494A414A50754C6F644D6B590A744A4855596D546266364D473859675961704169504C7A2B452F43484648763235422B4F314F52527868466E526768527934595556442B384D2F352B624A7A2F0A467030597656474F4E61616E5A7368795A3973685A7248556D33674477464136364D7A77334C796554503676425A593148316461742F2F4F2B5432334C4C62320A564E3349357849365461354D697264636D7253334944334B66794930726E343761475942524F6342546B5A546D7A4E673935532B557A65516330507A4D734E540A373975712F6E524F616364726A47435433735448444E2F684D71374D6B7A7452654A566E692B34395676344D30476B5047772F7A4A535A724D323333626B66360A6330506C6667366C5A72457066444B455931574A784133426B31517747524F7330333033702B74644F6D7731584E744231784C6171556B4C3339694169676D540A596F36315A73386C694D3245754C452F70446B5032514B6536784A4D6C587A7A61775770586861447A4C686E347567546E63786267744E4D732B31622F39376C0A6336776A4F793041767A565664416C4A32456C59476E2B534E755A526B67377A4A6E306354526538796578444A74432F5156394171555245394A6E6E563465650A55423958564B672B2F58526A4C3746515A516E6D574549755178704D7450416C52316E364242365431435A47536C43427374362B654C66385A785868795665450A4867396A31756C6975745A6656533771584D596F4341516C4F62674F4B366E79544A6363427A384E5576587437792B4344774944415141426F304977514441640A42674E56485134454667515555336D2F57716F7253733955674F48596D384364387249445A73737744675944565230504151482F42415144416745474D4138470A41315564457745422F7751464D414D42416638774451594A4B6F5A496876634E4151454D425141446767494241467A556641335039774639515A6C6C444850460A55702F4C2B4D2B5A426E3862326B4D566E3534435656655746504653504365486C436A74487A6F424E364A322F464E5177495362786D744F756F776854364B4F0A56574B5238326B56324C794934385371432F3376714F6C4C56536F474947315665436B5A376C38775845736B4556582F4A4A707558696F723767744E6E332F330A41546955464A564442776E37594B6E75484B73536A4B436158716559616C6C74697A38492B386A5252613859465753514567397A4B4337463469524F2F466A730A385052462F694B7A36792B4F30746C46595158426C322B6F646E4B50693477327237384E426335786A65616D62783973706E466978646A516733494D385763520A69517963453078794E4E2B3831584866716E486434626C736A4477535857586176566353746B4E722F2B58655457595255632B5A72757758747568786B597A650A536637644E58476946536555484D39683479613762364E6E4A534664357430644379356F477A7543722B79445A3458556D46463073626D5A67496E2F6633675A0A58486C4B59433653514B354D4E796F737963646979413564397A5A627975416C4A51473033526F486E48634150394463316577393150713750387946316D392F0A7153336675514C33395A65617454586177326577683071704B4A346A6A7639634A32766873452F7A422B34414C74525A68387453515A587139456658376D52420A5658794E57514B5633574B6477726E7557696830684B5762743544484441666639596B3264444C574B4D4777734176676E457A44484E623834326D31523061420A4C364B4371394E6A524844456A6638744D3771746A3375316349697550686E5051436A592F4D69517531325A49765653356C6A4648346778512B3649486466470A6A6A78446168326E474E35395052627859766E4B6B4B6A390A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0ACC483046022100EDB4403AE1032D31212A4868B2B9D2937B70C8C340C41FB917696C70CBF01579022100BCDBD8A6B6B811EEAF94E934FC3EDF2771BCCFA57F5A339AA25441F9A3B31819");
      break;
    case "PCI":
      mt_UI.LogData(`Setting Root Certificate and Trust Config for PCI Device`);
      Resp = await mt_MMS.sendCommand("AA0081040108D8128444D812810405000100A22B8104000008948201048320AF7C5A76D749BB97A21B346BAF92EFF1A7FBE37065C5F4787C006761FBF3B26DA30A81083035303030313030870101");
      Resp = await mt_MMS.sendCommand("AA0081080400D81205000100848208944D47544B41503130C10405000100830100850102A78208328182082E2D2D2D2D2D424547494E2043455254494649434154452D2D2D2D2D0A4D494946336A4343413861674177494241674951416631744D50796A796C476F4737786B446A55444C54414E42676B71686B69473977304241517746414443420A6944454C4D416B474131554542684D4356564D78457A415242674E5642416754436B356C6479424B5A584A7A5A586B784644415342674E56424163544330706C0A636E4E6C65534244615852354D523477484159445651514B457856556147556756564E46556C525356564E554945356C64486476636D73784C6A417342674E560A42414D544A56565452564A55636E567A64434253553045675132567964476C6D61574E6864476C76626942426458526F62334A7064486B774868634E4D5441770A4D6A41784D4441774D4441775768634E4D7A67774D5445344D6A4D314F545535576A43426944454C4D416B474131554542684D4356564D78457A415242674E560A42416754436B356C6479424B5A584A7A5A586B784644415342674E56424163544330706C636E4E6C65534244615852354D523477484159445651514B457856550A6147556756564E46556C525356564E554945356C64486476636D73784C6A417342674E5642414D544A56565452564A55636E567A6443425355304567513256790A64476C6D61574E6864476C76626942426458526F62334A7064486B77676749694D4130474353714753496233445145424151554141344943447741776767494B0A416F494341514341456D55584E6737443277697A304B7858445862747A536654544B3151673248697169424E4353316B43647A4F695A2F4D50616E7339732F420A3350485473645A374E7967524B3066614F6361384F686D3058366139665A326A59304B3264764B704F7975522B4F4A76304F7757494A414A50754C6F644D6B590A744A4855596D546266364D473859675961704169504C7A2B452F43484648763235422B4F314F52527868466E526768527934595556442B384D2F352B624A7A2F0A467030597656474F4E61616E5A7368795A3973685A7248556D33674477464136364D7A77334C796554503676425A593148316461742F2F4F2B5432334C4C62320A564E3349357849365461354D697264636D7253334944334B66794930726E343761475942524F6342546B5A546D7A4E673935532B557A65516330507A4D734E540A373975712F6E524F616364726A47435433735448444E2F684D71374D6B7A7452654A566E692B34395676344D30476B5047772F7A4A535A724D323333626B66360A6330506C6667366C5A72457066444B455931574A784133426B31517747524F7330333033702B74644F6D7731584E744231784C6171556B4C3339694169676D540A596F36315A73386C694D3245754C452F70446B5032514B6536784A4D6C587A7A61775770586861447A4C686E347567546E63786267744E4D732B31622F39376C0A6336776A4F793041767A565664416C4A32456C59476E2B534E755A526B67377A4A6E306354526538796578444A74432F5156394171555245394A6E6E563465650A55423958564B672B2F58526A4C3746515A516E6D574549755178704D7450416C52316E364242365431435A47536C43427374362B654C66385A785868795665450A4867396A31756C6975745A6656533771584D596F4341516C4F62674F4B366E79544A6363427A384E5576587437792B4344774944415141426F304977514441640A42674E56485134454667515555336D2F57716F7253733955674F48596D384364387249445A73737744675944565230504151482F42415144416745474D4138470A41315564457745422F7751464D414D42416638774451594A4B6F5A496876634E4151454D425141446767494241467A556641335039774639515A6C6C444850460A55702F4C2B4D2B5A426E3862326B4D566E3534435656655746504653504365486C436A74487A6F424E364A322F464E5177495362786D744F756F776854364B4F0A56574B5238326B56324C794934385371432F3376714F6C4C56536F474947315665436B5A376C38775845736B4556582F4A4A707558696F723767744E6E332F330A41546955464A564442776E37594B6E75484B73536A4B436158716559616C6C74697A38492B386A5252613859465753514567397A4B4337463469524F2F466A730A385052462F694B7A36792B4F30746C46595158426C322B6F646E4B50693477327237384E426335786A65616D62783973706E466978646A516733494D385763520A69517963453078794E4E2B3831584866716E486434626C736A4477535857586176566353746B4E722F2B58655457595255632B5A72757758747568786B597A650A536637644E58476946536555484D39683479613762364E6E4A534664357430644379356F477A7543722B79445A3458556D46463073626D5A67496E2F6633675A0A58486C4B59433653514B354D4E796F737963646979413564397A5A627975416C4A51473033526F486E48634150394463316577393150713750387946316D392F0A7153336675514C33395A65617454586177326577683071704B4A346A6A7639634A32766873452F7A422B34414C74525A68387453515A587139456658376D52420A5658794E57514B5633574B6477726E7557696830684B5762743544484441666639596B3264444C574B4D4777734176676E457A44484E623834326D31523061420A4C364B4371394E6A524844456A6638744D3771746A3375316349697550686E5051436A592F4D69517531325A49765653356C6A4648346778512B3649486466470A6A6A78446168326E474E35395052627859766E4B6B4B6A390A2D2D2D2D2D454E442043455254494649434154452D2D2D2D2D0ACC483046022100CD848A0FEBBD4951B6BD4C47E7847038C9405D13128DBB707851ED06149EB58C022100B3E2133B111FCBD64136B4666762F971C403388D3E2941C7540B5C0BD98172B1");
      break;
    default:
      mt_UI.LogData(`Unknown Device: ${fw} Type No Trust Config`);
      break;
  }
    ShowDeviceResponses = false;

}
async function getWLANMode(){  
  let mode = "";
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 870402020101 8902 D100");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode =="00")  
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);            
    let val = mt_Utils.getTagValue("D1","",Tag84.substring(26),false);
    switch (val) {
      case "00":
        mode = "MQTT"        
        break;
      case "02":
        mode = "WebSocket Server"        
        break;
    
      default:
        mode = "Unknown Mode"        
        break;
    }
    
    mt_UI.LogData(`WLAN Mode: ${mode}`);
  }


}
async function setWLANMode(hexMode) {  
  let mode = "";
  let val = "02";
    switch (hexMode) {
      case "00":
        mode = "MQTT"
        val = "00";        
        break;
      default:
        mode = "WebSocket Server";
        val = "02";
        break;
    }

  let Resp = await mt_MMS.sendCommand(`AA00 81040155D111 8410 D111 850101 870402020101 8903 D101 ${val}`);
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode =="00")  
  {
    mt_UI.LogData(`WLAN Mode: ${mode}`);
  }


}


async function getAddressMode(){

  let Resp = await mt_MMS.sendCommand("AA0081040116D101841AD10181072B06010401F609850101890AE208E206E104E102C500");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode =="00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C5","",Tag84.substring(48),false);
    let mode = "";
    switch (val) {
      case "00000000":
        mode = "Static IP";
        break;
      default:
        mode = "DHCP";
        break;
    }
    mt_UI.LogData(`Wireless Address Mode: ${mode}`);
  }
}
async function setAddressMode(){
  mt_UI.LogData("Setting Wireless Address Mode DHCP");
  let Resp = await mt_MMS.sendCommand("AA0081040117D111841ED11181072B06010401F609850101890EE20CE20AE108E106C50400000001");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C5","",Tag84.substring(48),false);    
  }
}

async function getWirelessSecurityMode(){

  let Resp = await mt_MMS.sendCommand("AA0081040113D101841AD10181072B06010401F609850101890AE208E206E104E102C300");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C3","",Tag84.substring(48),false);
    let mode = "";
    switch (val) {
      case "00":
        mode = "PSK";
        break;
      case "01":
        mode = "EAP-PEAP";
        break;
      default:
        mode = "Unknown Security Mode";
        break;
    }
    mt_UI.LogData(`Wireless Security Mode: ${mode}`);
  }
}
async function setWirelessSecurityMode(){
  mt_UI.LogData("Setting Wireless Security PSK Mode");
  let Resp = await mt_MMS.sendCommand("AA0081040114D111841BD11181072B06010401F609850101890BE209E207E105E103C30100");  
}

async function getDeviceIP(){
  let Resp = await mt_MMS.sendCommand("AA008104010ED101841AD10181072B06010401F609850102890AE108E206E504E602C300");
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.hexToDecIPv4(mt_Utils.getTagValue("C3","",Tag84.substring(48),false));    
    mt_UI.LogData(`IP Address: ${val}`);
  }
}

async function ResetDevice(){
  mt_UI.updateProgressBar("",-1);  
  mt_UI.LogData("Resetting Device...");
  ShowDeviceResponses = false;
  let Resp = await mt_MMS.sendCommand("AA00810401121F0184021F01"); 
  ShowDeviceResponses = true; 
  
}

async function getSSID() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA0081040112D101841AD10181072B06010401F609850101890AE208E206E104E102C100");  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C1","",Tag84.substring(48),true);
    mt_UI.UpdateValue("ssidName",val);
    mt_UI.LogData(`SSID: ${val}`);    
  }
}

async function getMQTTBroker() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 8704 02020102 8902 C100");  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);       
    let val =  mt_Utils.getTagValue("C1","",Tag84.substring(26),true);
    mt_UI.LogData(`MQTT Broker: ${val}`);    
  }
}

async function setMQTTBroker(Name) {
  mt_UI.updateProgressBar("",-1);  
  let name = Name;
  if(name.length > 0)
  {
    let val = mt_Utils.AsciiToHexPad(name, 0x20);
    mt_UI.LogData(`Setting MQTT Broker: ${name}`);
    let resp = await mt_MMS.sendCommand(`AA0081040155D111844FD1118501018704020201028942C140${val}`); 
  }
}


async function getMQTTPort() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 870402020102 8902 C200");  
  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);       
    let val = mt_Utils.hexToNumber(mt_Utils.getTagValue("C2","",Tag84.substring(26),false));
    mt_UI.LogData(`MQTT Port: ${val}`);    
  }
}
async function getMQTTUser() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 8704 02020102 8902 C700");  
  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);       
    let val = mt_Utils.getTagValue("C7","",Tag84.substring(26),true);
    mt_UI.UpdateValue("mqttUser",val);
    mt_UI.LogData(`MQTT User: ${val}`);    
  }
}
async function setMQTTUser() {
  let resp = "";
  mt_UI.updateProgressBar("",-1);  
   let name = mt_UI.GetValue("mqttUser");
  if(name.length > 0)
  {
    let val = mt_Utils.AsciiToHexPad(name, 0x20);
    mt_UI.LogData(`Setting MQTT User Name: ${name}`);
    let resp = await mt_MMS.sendCommand(`AA0081040155D111842FD1118501018704020201028922C720${val}`); 
  }
}

async function setMQTTPassword() {
  mt_UI.updateProgressBar("",-1);  
   let name = mt_UI.GetValue("mqttPassword");
  if(name.length > 0)
  {
    let val = mt_Utils.AsciiToHexPad(name, 0x20);
    mt_UI.LogData(`Setting MQTT Password: **********`);
    let resp = await mt_MMS.sendCommand(`AA0081040155D111842FD1118501018704020201028922C820${val}`); 
  }
}
async function getMQTTSubTopic() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 8704 02020102 8902 C400");  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);       
    let val = mt_Utils.getTagValue("C4","",Tag84.substring(26),true);
    //mt_UI.UpdateValue("mqttSubTopic",val);
    mt_UI.LogData(`MQTT Subscribe Topic: ${val}`);
  }
}
async function setMQTTSubTopic() 
{
  mt_UI.updateProgressBar("",-1);  
  let resp = "";
  let val = "";
  
  let org = mt_UI.GetValue("mqttOrg");  
  if(org.length > 0)
  {
    let devType = mt_Utils.filterString(mt_MMS._device.productName);
    let devSN = await getDevSN();
    let  name  = `${org}${devType}/${devSN}/SendCommand`;
    val = mt_Utils.AsciiToHexPad(name, 0x40);
    mt_UI.LogData(`Setting MQTT Subscribe Topic: ${name}`);
    resp = await mt_MMS.sendCommand(`AA0081040155D111844FD1118501018704020201028942C440${val}`); 
  }
}

async function getMQTTPubTopic() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA00 8104 0155D101 840F D101 850101 8704 02020102 8902 C500");  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);       
    let val = mt_Utils.getTagValue("C5","",Tag84.substring(26),true);
    //mt_UI.UpdateValue("mqttPubTopic", val);
    mt_UI.LogData(`MQTT Publish Topic: ${val}`);
  }
}

async function setMQTTPubTopic() 
{
  mt_UI.updateProgressBar("",-1);  
  let resp = "";
  let val = "";
  
  let org = mt_UI.GetValue("mqttOrg");  
  if(org.length > 0)
  {
    let devType = mt_Utils.filterString(mt_MMS._device.productName);
    let devSN = await getDevSN();
    let name  = `${org}${devType}/${devSN}`;

    val = mt_Utils.AsciiToHexPad(name, 0x40);
    mt_UI.LogData(`Setting MQTT Publish Topic: ${name}`);
    resp = await mt_MMS.sendCommand(`AA0081040155D111844FD1118501018704020201028942C540${val}`); 
  }
}

async function setSSID() {
  mt_UI.updateProgressBar("",-1);  
  let resp = "";
  let val = "";
  
  let name = mt_UI.GetValue("ssidName");
  
  if(name.length > 0)
  {
    // mt_UI.LogData("Setting DHCP Mode");
    // resp = await mt_MMS.sendCommand("AA0081040117D111841ED11181072B06010401F609850101890EE20CE20AE108E106C50400000001");

    val = mt_Utils.AsciiToHexPad(name, 0x20);
    mt_UI.LogData(`Setting SSID: ${name}`);
    resp = await mt_MMS.sendCommand(`AA0081040107D111843AD11181072B06010401F609850101892AE228E226E124E122C120${val}`); 
  }

  name = mt_UI.GetValue("ssidPwd");
  
  if(name.length > 0)
  {
    val = mt_Utils.AsciiToHexPad(name, 0x3F);
    mt_UI.LogData("Setting Wireless Password: **********");
    resp = await mt_MMS.sendCommand(`AA0081040107D1118459D11181072B06010401F6098501018949E247E245E143E141C23F${val}`);  
  }
}

async function getDevSN(){
  try {
    let resp = await mt_MMS.sendCommand('AA00810401B5D1018418D10181072B06010401F6098501028704020101018902C100');
    return mt_Utils.filterString(resp.TLVData.substring(68, 75));
  } catch (error) {
    return "";
  }
}


async function getDeviceName() {
  mt_UI.updateProgressBar("",-1);  
  let Resp = await mt_MMS.sendCommand("AA0081040125D101841AD10181072B06010401F609850101890AE208E206E104E102C800");  
  if (Resp.OperationDetailCode == "000000" && Resp.OperationStatusCode == "00")
  {
    let Tag84 = mt_Utils.getTagValue("84","",Resp.TLVData);        
    let val = mt_Utils.getTagValue("C8","",Tag84.substring(48),true);
    mt_UI.LogData(`Device Name: ${val}`);
  }
}


async function handleDOMLoaded() {
  let devices = await mt_MMS.getDeviceList();
  mt_UI.LogData(`Devices currently attached and allowed:`);
  
  if (devices.length == 0) mt_UI.setUSBConnected("Connect a device");
  devices.forEach((device) => {
    mt_UI.LogData(`${device.productName}`);
    mt_UI.setUSBConnected("Connected");
  });

}

async function handleCloseButton() {
  mt_MMS.closeDevice();
  mt_UI.ClearLog();
}

async function handleClearButton() {
  mt_UI.ClearLog();
  mt_UI.DeviceDisplay("");
  mt_UI.UpdateValue("ssidName","");
  mt_UI.UpdateValue("ssidPwd","");
  mt_UI.UpdateValue("mqttUser","");
  mt_UI.UpdateValue("mqttPassword","");
  //mt_UI.UpdateValue("mqttSubTopic","");
  //mt_UI.UpdateValue("mqttPubTopic","");  
}



async function handleOpenButton() {
  window.mt_device_hid = await mt_MMS.openDevice();
}

function updateProgress(caption, progress ){
  EmitObject({ Name: "OnRMSProgress", Data: {Caption: caption, Progress: progress }});
};

async function parseCommands(description, messageArray) {
  mt_UI.updateProgressBar("",0);  
  for (let index = 0; index < messageArray.length; index++) 
  {
    let progress = parseInt((index / messageArray.length) * 100);
    updateProgress(`Loading ${description}`, progress);
    await parseCommand(messageArray[index]);
  }
  updateProgress(`Done Loading ${description}...`, 100);
};

async function parseCommand(message) {
  let Response;
  let cmd = message.split(",");
  switch (cmd[0].toUpperCase()) {
    case "GETAPPVERSION":      
      break;
    case "GETDEVINFO":      
      break;
    case "SENDCOMMAND":
      Response = await mt_MMS.sendCommand(cmd[1]);      
      break;
    case "GETDEVICELIST":
      devices = getDeviceList();      
      break;
    case "OPENDEVICE":
      window.mt_device_hid = await mt_MMS.openDevice();      
      break;
    case "CLOSEDEVICE":
      window.mt_device_hid = await mt_MMS.closeDevice();
      break;
    case "WAIT":
      wait(cmd[1]);
      break;
    case "DETECTDEVICE":
      window.mt_device_hid = await mt_MMS.openDevice();      
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
    case "PARSEMMS":
      retval = mt_Utils.MMSParser(cmd[1]);
      mt_UI.LogData(JSON.stringify(retval));
      break;
    case "DISPLAYMESSAGE":
      mt_UI.LogData(cmd[1]);
      break;
    default:
      mt_Utils.debugLog(`Unknown Command: ${cmd[0]}`);
  }
};

const deviceConnectLogger = async (e) => {
  mt_UI.setUSBConnected("Connected");
    if (window.mt_device_WasOpened) 
    {
      await mt_Utils.wait(_openTimeDelay);
      await handleOpenButton();
    }

};
const deviceDisconnectLogger = (e) => {
  mt_UI.setUSBConnected("Disconnected");
};
const deviceCloseLogger = (e) => {
  mt_UI.setUSBConnected("Closed");
};
const deviceOpenLogger = async (e) => {
  mt_UI.setUSBConnected("Opened");
  await getConfig();

};
const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};

const powerLogger = (e) => {
  switch (e.Data) {
    case "Reset":
      //mt_UI.LogData(`Resetting...`);    
      break;
    default:
      mt_UI.LogData(`${e.Name}: ${e.Data}`);
      break;
  }
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
  mt_UI.LogData(`Barcode  Data: ${mt_Utils.getTagValue("DF74", "", e.Data, true)}`);
};
const arqcLogger = (e) => {
  mt_UI.LogData(`${e.Source} ARQC Data:  ${e.Data}`);
  let TLVs = mt_Utils.tlvParser(e.Data.substring(4));
   mt_UI.PrintTLVs(TLVs);
};
const batchLogger = (e) => {
  mt_UI.LogData(`${e.Source} Batch Data: ${e.Data}`);
};
const fromDeviceLogger = (e) => {
  if (ShowDeviceResponses) mt_UI.LogData(`Device Response: ${e.Data.HexString}`);
  
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
};
const touchDownLogger = (e) => {

};
const contactlessCardDetectedLogger = async (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Detected`);
};

const contactlessCardRemovedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contactless Card Removed`);
};

const contactCardInsertedLogger = (e) => {
  _contactSeated = true;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Inserted`);
};

const contactCardRemovedLogger = (e) => {
  _contactSeated = false;
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`Contact Card Removed`);
};

const msrSwipeDetectedLogger = (e) => {
  if (e.Data.toLowerCase() == "idle") mt_UI.LogData(`MSR Swipe Detected ${e.Data}`);  
};

const userEventLogger = (e) => {
  mt_UI.LogData(`User Event Data: ${e.Name} ${e.Data}`);
};

const fileLogger = async (e) => {
  
    let resp = null;

    
    let tagData = mt_Utils.getTagValue("84", "", e.Data.TLVData.substring(8), false);
    let tagFileName = mt_Utils.getTagValue("C1", "", tagData.substring(16), false);
    let tagFileContents = mt_Utils.getTagValue("CE", "", tagData.substring(16), false);

    switch (tagFileName) {
      case "03000000": case "03000100": case "03000200": case "03000300": case "03000400":case "03000500": case "03000900": 
        mt_UI.LogData(`Checking ${tagFileName} certificate expiration...`);
        resp = await mt_CertMgr.VerifyCertificate(fwID,tagFileContents);
        if (!resp.status.ok){
          mt_UI.LogData(mt_UI.StringNoNulls(resp));
        }
        else
        {
          if (resp.data.isValidNow && resp.data.expiresInDays > CertExpirationWarningDays)
          {
            mt_UI.LogData(`The certificate named ${resp.data.commonName} in slot ${tagFileName} is valid `);
            mt_UI.LogData("=============================");
            mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
            mt_UI.LogData("=============================");
          }
          else
          {
            if (!resp.data.isValidNow){
              mt_UI.LogData(`The certificate named ${resp.data.commonName} in slot ${tagFileName} is not valid`);
              mt_UI.LogData("=============================");
              mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
              mt_UI.LogData("=============================");
            }
            else
            {
              mt_UI.LogData(`The certificate named ${resp.data.commonName} in slot ${tagFileName} is valid. However, it expires in ${resp.data.expiresInDays} days`);
              mt_UI.LogData("=============================");
              mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
              mt_UI.LogData("=============================");
            }
          }
        }
       
      break;
      case '04000000':
        ShowDeviceResponses = false;
        //CertExpirationDays = parseInt(mt_UI.GetValue("certDays"));
        mt_UI.LogData(`CSR signed for ${CertExpirationDays} days... `);
        
        
        resp = await mt_CertMgr.SignCSR(fwID, tagFileContents, CertExpirationDays, "Days");
        if (!resp.status.ok){
          mt_UI.LogData("=============================");
          mt_UI.LogData(mt_UI.StringNoNulls(resp));
          mt_UI.LogData("=============================");
        }
        
        if (resp.status.ok){
          //mt_UI.LogData("=============================");
          //mt_UI.LogData(mt_UI.StringNoNulls(resp.data));
          //mt_UI.LogData("=============================");
          await parseCommands('Certificate Update', resp.data.certificateLoadCommands);
        }
        ShowDeviceResponses = true;
        break;
      default:
        mt_UI.LogData(`File: ${tagFileName} ${e.Data.HexString}`);
        break;
    }
  
};

const displayRMSProgressLogger = (e) => {  
  mt_UI.updateProgressBar(e.Data.Caption, e.Data.Progress)
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

EventEmitter.on("OnPowerEvent", powerLogger);

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
EventEmitter.on("OnRMSProgress", displayRMSProgressLogger);