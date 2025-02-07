let replacements = {};

const networkNamePath = `https://rms.magensa.net/test/MagensaNormalizedFieldNames.json`;
const localReplacements = {
   hostReferenceNumber:"MagensaProcessor_ReferenceNumber",
   responseCode:"MagensaProcessor_ResponseCode",
   transactionTimestamp:"MagensaProcessor_Timestamp",
   status: "MagensaProcessor_Status"
 }  


async function parseXml(xml) 
{
  var dom = null;
  if (window.DOMParser) 
  {
    try 
    { 
      dom = (new DOMParser()).parseFromString(xml, "text/xml"); 
    } 
      catch (e) { dom = null; }
  }
    return dom;
}

async function parseTheDOM(node, func) 
{
   func(node);
   node = node.firstChild;
   while (node) {
     await parseTheDOM(node, func);
     node = node.nextSibling;
   }
 }

function sanitizeXMLData(data)
{
  let xmlStartPos = data.indexOf("&");
  xmlStartPos = xmlStartPos > 0 ? xmlStartPos + 1 : 0;
  let xmlDoc = data.substring(xmlStartPos);
  xmlDoc = xmlDoc.replace("&<?xml version=\"1.0\" encoding=\"UTF-8\"?>", "");
  return xmlDoc;
}

export async function XmltoDict(xml, dictionary)
{   
  //console.log(`dict size ${dictionary}`);
  replacements = await FetchNames(networkNamePath);
  let dom = await parseXml(sanitizeXMLData(xml));
  //console.log(`DOM ${JSON.stringify(dom)}`);
  await parseTheDOM(dom, async function(node) 

  {
    //console.log(`node ${JSON.stringify(node)}`);

    if (node.nodeType == 1 && node.childElementCount == 0 )
    {
      

      if (node.nodeName == "Payload")
      {
        await XmltoDict(node.textContent, dictionary);
      }
      else
      {
        //console.log(`details- ${normalizeNames(node.nodeName)} ${node.textContent}`);
        dictionary[normalizeNames(node.nodeName)] = node.textContent;
      }              
    } 
  }
);

//console.log(`details- ${JSON.stringify(dictionary)}`);
return true;
}

async function FetchNames(jsonUrl){
  try 
  {
    const response = await fetch(jsonUrl);
    if (response.ok) return await response.json();
  } 
  catch (error) {}
  return localReplacements;
}

function normalizeNames(name) {
  if (replacements.hasOwnProperty(name)) 
  {
      return replacements[name]; // Replace with the corresponding value
  } 
  else 
  {
      return name; // Return the original string if no replacement exists
  }
}