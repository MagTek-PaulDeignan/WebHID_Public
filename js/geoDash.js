import * as mt_Utils from "./MagTek_WebAPI/mt_utils.js";

import DeviceFactory from "./MagTek_WebAPI/device/API_device_factory.js";
let mt_MQTT = DeviceFactory.getDevice("MMS_MQTT");

import "./MagTek_WebAPI/mt_events.js";

let retval = "";
let url = mt_Utils.getEncodedValue('MQTTURL','d3NzOi8vZGV2ZWxvcGVyLmRlaWduYW4uY29tOjgwODQvbXF0dA==');
let devPath = mt_Utils.getEncodedValue('MQTTDevice','');
let userName = mt_Utils.getEncodedValue('MQTTUser','RGVtb0NsaWVudA==');
let password = mt_Utils.getEncodedValue('MQTTPassword','ZDNtMENMdjFjMQ==');
let client = null;

let map = null;
const deviceMarkers = new Map(); // To track individual markers by serial number
const logList = document.getElementById('log-list');

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.devpath;
if (value != null) {
  devPath = value;
}




if (userName.length == 0 ) userName = null;
if (password.length == 0 ) password = null;


const markers = L.markerClusterGroup();

// --- CONFIGURATION ---

// The list of devices in the specified format.
// Format: Organization/Country/State/City/DeviceName/DeviceType/DeviceSerialNumber
const deviceList = [
];

// --- APPLICATION LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    
     handleOpenButton();

    // Initialize the map and set its view to a global perspective.
    map = L.map('map').setView([39.8283, -98.5795], 4); // Centered on the US
    
    // Add a tile layer to the map (the map's background image).
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create a marker cluster group. This will group nearby markers into a single icon.
    

map.addLayer(markers);
    
});



function EmitObject(e_obj) {
  EventEmitter.emit(e_obj.Name, e_obj);
};



async function handleOpenButton() {
  
  mt_MQTT.setURL(url);
  mt_MQTT.setUserName(userName);
  mt_MQTT.setPassword(password);
  mt_MQTT.setPath(devPath);  
  mt_MQTT.setDeviceList(mt_Utils.getEncodedValue("MQTTDeviceList", "TWFnVGVrL1VTLysvKy8rLysvKy9TdGF0dXM="));
  mt_MQTT.openDevice();  
}



const dataLogger = (e) => {
  mt_UI.LogData(`Received Data: ${e.Name}: ${e.Data}`);
};


const errorLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};
const debugLogger = (e) => {
  mt_UI.LogData(`Error: ${e.Source} ${e.Data}`);
};

const mqttStatus = e => {
  let deviceStatus = e.Data.Message;
  let devicePath = `${mt_Utils.removeLastPathSegment(e.Data.Topic)}`;  
  

  addOrUpdateDevice(devicePath,deviceStatus)

}


            /**
             * Generates the HTML content for a marker's popup.
             * @param {object} device - The parsed device object.
             * @returns {string} HTML string for the popup.
             */
            function createPopupContent(device) {
                return `
                    <div class="text-sm">
                        <b class="text-base">${device.name}</b><br>
                        <b>Serial #:</b> ${device.serialNumber}<br>
                        <b>Location:</b> ${device.city}, ${device.state}<br>
                        <b>Type:</b> ${device.deviceType}<br>
                        <b><a id="dev-${device.deviceType}${device.serialNumber}" href="/Test/Demo/mmsMQTTDemo.html?devpath=${device.devPath}" style="display: inline-flex;"><img src="./images/${device.deviceType}.png" class="img-fluid img-thumbnail" height="30px" width="30px"><img src="./images/${device.deviceStatus}.png" class="thumbnail" height="10px" width="10px"></a></b>
                    </div>
                `;
            }

            /**
             * Geocodes a device and then either adds a new pin or updates an existing one.
             * @param {string} deviceString - The raw device data string.
             */
            async function addOrUpdateDevice(deviceString, deviceStatus) {
                const device = parseDeviceString(deviceString ,deviceStatus);

        
                if (!device) return;
                const query = `${device.city}, ${device.state}, ${device.country}`;
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Network response not OK`);
                    const data = await response.json();

                    if (data && data.length > 0) {
                        const location = data[0];
                        const latLng = [parseFloat(location.lat), parseFloat(location.lon)];
                        const popupContent = createPopupContent(device);

                        // Check if the marker already exists
                        if (deviceMarkers.has(device.serialNumber)) {
                            // --- UPDATE EXISTING MARKER ---
                            const existingMarker = deviceMarkers.get(device.serialNumber);
                            existingMarker.setLatLng(latLng);
                            existingMarker.setPopupContent(popupContent);
                            logMessage(`Updated: ${device.serialNumber} to ${device.city}`, 'update');
                        } else {
                            // --- ADD NEW MARKER ---
                            const newMarker = L.marker(latLng);
                            newMarker.bindPopup(popupContent);
                            
                            // Add to cluster group and our tracking map
                            markers.addLayer(newMarker);
                            deviceMarkers.set(device.serialNumber, newMarker);
                            logMessage(`Added: ${device.serialNumber} in ${device.city}`, 'add');
                        }
                    } else {
                        throw new Error(`No results found for ${query}`);
                    }
                } catch (error) {
                    console.error('Processing error:', error);
                    logMessage(`Failed: S/N ${device.serialNumber} (${query})`, 'error');
                }
            }




    // Function to add a message to the on-screen log
    function logMessage(message, isError = false) {
        const li = document.createElement('li');
        li.textContent = message;
        li.className = isError ? 'text-red-500' : 'text-green-600';
        logList.appendChild(li);
    }



    /**
     * Parses a device string to extract its components.
     * @param {string} deviceString - The full device identifier string.
     * @returns {object|null} An object with location and serial number, or null if format is incorrect.
     */
    function parseDeviceString(deviceString, deviceStatus) {
        const parts = deviceString.replaceAll("_", " ").split('/');
        if (parts.length < 7) {
            logMessage(`Invalid format: ${deviceString}`, true);
            return null;
        }

        if (parts[3] == 'SealBeach')  parts[3] = 'Seal Beach';
        
        return {
            org:parts[0],
            country: parts[1],
            state: parts[2],
            city: parts[3],
            name: parts[4],
            deviceType: parts[5],
            serialNumber: parts[6],
            devPath: deviceString,
            deviceStatus: deviceStatus
        };
    }


// Subscribe to  events
EventEmitter.on("OnDebug", debugLogger);
EventEmitter.on("OnMQTTStatus", mqttStatus);