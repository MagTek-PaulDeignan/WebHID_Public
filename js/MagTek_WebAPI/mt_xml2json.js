let replacements = {};

const networkNamePath = `https://rms.magensa.net/test/MagensaNormalizedFieldNames.json`;
const localReplacements = {};  

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
  replacements = await FetchNames(networkNamePath);
  let dom = await parseXml(sanitizeXMLData(xml));
  await parseTheDOM(dom, async function(node) 

  {
    if (node.nodeType == 1 && node.childElementCount == 0 )
    {
      if (node.nodeName == "Payload")
      {
        await XmltoDict(node.textContent, dictionary);
      }
      else
      {

        dictionary[normalizeNames(node.nodeName)] = node.textContent;
      }              
    } 
  }
);
return true;
}

export async function KVPtoDict(kvpArray, dictionary)
{
  let rc = false;
  if(kvpArray.length > 0)
    {
      rc = true;
      kvpArray.forEach(element => {
        dictionary[normalizeNames(element["key"])] = element["value"];
      }
    )
    }
    return rc;
  
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