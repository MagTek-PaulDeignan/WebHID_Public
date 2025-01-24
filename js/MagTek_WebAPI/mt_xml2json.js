//let replacements = FetchNames(`https://rms.magensa.net/test/MagensaNormalizedFieldNames.json`);

function parseXml(xml) 
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

function parseTheDOM(node, func) 
{
   func(node);
   node = node.firstChild;
   while (node) {
     parseTheDOM(node, func);
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

export function XmltoDict(xml, dictionary)
{   
  
  let dom = parseXml(sanitizeXMLData(xml));
  parseTheDOM(dom, function(node) 
  {
    if (node.nodeType == 1 && node.childElementCount == 0 )
    {
      if (node.nodeName == "Payload")
      {
        XmltoDict(node.textContent, dictionary);
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

async function FetchNames(jsonUrl){
  const response = await fetch(jsonUrl);
  if (!response.ok) {
      throw new Error(`Failed to fetch JSON file: ${response.statusText}`);
  }
  // Parse the JSON data
  return await response.json();
}


 const replacements =
 {
   hostReferenceNumber:"MagensaProcessor_ReferenceNumber",
   responseCode:"MagensaProcessor_ResponseCode",
   transactionTimestamp:"MagensaProcessor_Timestamp",
   status: "MagensaProcessor_Status"
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