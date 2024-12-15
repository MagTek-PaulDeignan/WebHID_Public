[Home](./index.md) [MagTek Web Demo Project](./MagTek_Demo_Project.md)

# MagTek Configuration Demo Integration Guide
This guide is designed for developers looking to integrate MagTek card readers into their web applications using the JavaScript code and WebSocket/MQTT setup provided in the Configuration Demo.
Prerequisites

## Before starting the integration process, ensure you have:
- A compatible MagTek card reader.
- A modern web browser that supports WebSocket communication.
- Basic knowledge of JavaScript, WebSocket, and MQTT protocols.
- Optional access to the Magensa Reader Management System (RMS) for device configuration.

### Required Modules and Libraries:
To use the Configuration Demo, include the following references in your HTML.
- Bootstrap CSS: Provides styling for the demo interface.
- JavaScript Module (configure.js): Contains the logic for managing WebSocket and MQTT configuration settings.

````javascript

<html>
<head>
    <title>MagTek Configure</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=yes">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" type="text/css" href="./css/site.css"/>
    <script type="module" src="./js/configure.js"></script>
</head>
<body>
    <!-- Configuration Demo content here -->
</body>
</html>
````
### configure.js: This script manages the configuration of WebSocket and MQTT settings for communication with the MagTek reader.
________________________________________

## Overview of the Sample Application
The Configuration Demo allows developers to:
1.	Set and configure RMS options, including API keys and profile names.
2.	Configure WebSocket options, including WebSocket server addresses.
3.	Set up MQTT options, including server URLs, device IDs, and user credentials.
4.	Configure contactless reader settings, such as delay settings.
________________________________________

## Step 1: Step-by-Step Integration
Step 1: Configuring RMS Options
The RMS (Reader Management System) configuration allows you to set up the necessary API keys and profile names to communicate with Magensa’s RMS services.
````javascript
document.getElementById('btnSave').addEventListener('click', () => {
    const profileName = document.getElementById('txProfileName').value;
    const apiKey = document.getElementById('txAPIKey').value;
    const url = document.getElementById('txURL').value;
    
    // Example function to save RMS configuration
    saveRMSConfig(profileName, apiKey, url);
});

function saveRMSConfig(profileName, apiKey, url) {
    // Save the RMS configuration (implementation may vary)
    console.log('Saving RMS Configuration:', profileName, apiKey, url);
    // Call a backend service or save locally as needed.
}
````
## Step 2: Configuring WebSocket Options
WebSocket options allow for the communication between the web app and the card reader using WebSocket protocol. Set the WebSocket server address and save it:
````javascript
document.getElementById('btnSave').addEventListener('click', () => {
    const wsAddress = document.getElementById('txWSAddress').value;
    
    // Example function to save WebSocket configuration
    saveWebSocketConfig(wsAddress);
});

function saveWebSocketConfig(wsAddress) {
    // Save the WebSocket configuration
    console.log('Saving WebSocket Address:', wsAddress);
    // Connect to the WebSocket server using the provided address.
}
````
## Step 3: Configuring MQTT Options
The MQTT configuration allows for device communication through MQTT protocol. Set the MQTT server URL, device ID, and credentials:
````javascript
document.getElementById('btnSave').addEventListener('click', () => {
    const mqttUrl = document.getElementById('txMQTTURL').value;
    const mqttDevice = document.getElementById('txMQTTDevice').value;
    const mqttUser = document.getElementById('txMQTTUser').value;
    const mqttPassword = document.getElementById('txMQTTPassword').value;

    // Example function to save MQTT configuration
    saveMQTTConfig(mqttUrl, mqttDevice, mqttUser, mqttPassword);
});

function saveMQTTConfig(mqttUrl, mqttDevice, mqttUser, mqttPassword) {
    // Save the MQTT configuration
    console.log('Saving MQTT Configuration:', mqttUrl, mqttDevice, mqttUser);
    // Use MQTT.js or another library to connect using the provided settings.
}
````
## Step 4: Configuring Contactless Options
Configure the delay for contactless operations using the provided input fields:
````javascript
document.getElementById('btnSave').addEventListener('click', () => {
    const contactlessDelay = document.getElementById('txContactlessDelay').value;
    
    // Example function to save contactless configuration
    saveContactlessConfig(contactlessDelay);
});

function saveContactlessConfig(contactlessDelay) {
    // Save the contactless delay setting
    console.log('Saving Contactless Delay:', contactlessDelay);
}
````
## Step 5: Saving Configuration Settings
After setting the configurations, the settings can be saved using a backend service or locally using localStorage or another storage mechanism as needed.
________________________________________
## Command Documentation
Below is a partial list of the primary configuration options and commands supported in the Configuration Demo:
Configuration Option	Description	Example Usage

- Profile Name	Name of the RMS profile used for accessing Magensa services.	txProfileName input field
- API Key	API key for authenticating with the RMS.	txAPIKey input field
- RMS URL	URL of the Magensa RMS endpoint.	txURL input field
- WebSocket Address	Address of the WebSocket server for communication.	txWSAddress input field
- MQTT Address	MQTT broker URL for device communication.	txMQTTURL input field
- MQTT Device	Unique identifier for the MQTT device.	txMQTTDevice input field
- MQTT User	Username for MQTT authentication.	txMQTTUser input field
- MQTT Password	Password for MQTT authentication.	txMQTTPassword input field
- Contactless Delay	Delay setting for contactless transactions.	txContactlessDelay input field
- Save Configuration	Saves the configuration settings to be used by the web app.	btnSave button click
- Back	Returns to the previous screen or menu.	btnBack button click
________________________________________
## Troubleshooting
•	Connection Issues: Verify that the WebSocket address and MQTT URL are correct and that the server is reachable.
•	Authentication Errors: Double-check the API key and MQTT credentials to ensure they are correct.
•	Configuration Not Saved: Ensure that the JavaScript functions for saving configurations are correctly implemented and that any required backend services are running.
________________________________________
## Conclusion
This guide provides detailed instructions for configuring MagTek card readers using the Configuration Demo. By following these steps and using the provided code examples, you can integrate MagTek readers into your web applications with ease. For further assistance, refer to MagTek’s official documentation or contact their support team.
