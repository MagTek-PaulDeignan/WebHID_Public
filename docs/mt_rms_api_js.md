This JavaScript module facilitates API requests for firmware, tags, and configuration data by managing the URL, API key, and profile name settings. It includes methods for setting API credentials and functions for sending requests to the MagTek API endpoints.

# MagTek RMS API Interface - `API_rms.js`

## Table of Contents
1. [Overview](#overview)
2. [Global Variables](#global-variables)
3. [Configuration Functions](#configuration-functions)
4. [API Request Functions](#api-request-functions)
5. [Helper Functions](#helper-functions)
6. [Troubleshooting](#troubleshooting)
7. [License](#license)

---

### Overview
This module provides an interface to communicate with the MagTek RMS (Remote Management System) API. It includes functions to configure the API base URL, profile name, and API key, and to send requests to update firmware, retrieve tags, and get configurations for MagTek devices.

### Global Variables

- `BaseURL`: The base URL for the RMS API, configured through `setURL()`.
- `APIKey`: Stores the API key used for authentication.
- `ProfileName`: Stores the profile name associated with the device.

### Configuration Functions

1. `setAPIKey(key)`
   - Sets the `APIKey` variable for API authentication.
   - Parameters: `key` - API key as a string.

   ```javascript
   export function setAPIKey(key) {
     APIKey = key;
   }
   ```

2. `setProfileName(name)`
   - Sets the `ProfileName` variable for identifying the device profile.
   - Parameters: `name` - Profile name as a string.

   ```javascript
   export function setProfileName(name) {
     ProfileName = name;
   }
   ```

3. `setURL(url)`
   - Sets the `BaseURL` variable, which serves as the endpoint for all API requests.
   - Parameters: `url` - Base URL as a string.

   ```javascript
   export function setURL(url) {
     BaseURL = url;
   }
   ```

### API Request Functions

1. `GetFirmware(request)`
   - Sends a request to retrieve firmware information or updates for the device.
   - Parameters: `request` - JSON object containing device information.
   - Returns: Response JSON from the server.

   ```javascript
   export async function GetFirmware(request) {
     const url = BaseURL + "/Firmware";
     return await postRequest(url, APIKey, JSON.stringify(request));
   }
   ```

2. `GetTags(request)`
   - Sends a request to retrieve tag data for device configuration.
   - Parameters: `request` - JSON object with tag request details.
   - Returns: Response JSON containing tags.

   ```javascript
   export async function GetTags(request) {
     const url = BaseURL + "/tags";
     return await postRequest(url, APIKey, JSON.stringify(request));
   }
   ```

3. `GetConfig(request)`
   - Requests specific configuration settings for the device.
   - Parameters: `request` - JSON object with configuration request details.
   - Returns: JSON response with configuration settings.

   ```javascript
   export async function GetConfig(request) {
     const url = BaseURL + "/configs";
     return await postRequest(url, APIKey, JSON.stringify(request));
   }
   ```

### Helper Functions

1. `postRequest(url, apiKey, data)`
   - Helper function that sends a POST request with the specified data to the RMS API.
   - Parameters:
     - `url` - Full endpoint URL for the API request.
     - `apiKey` - API key used in the request headers.
     - `data` - JSON string containing the request payload.
   - Returns: JSON response from the server, or an error object if the request fails.

   ```javascript
   async function postRequest(url, apiKey, data) {
     try {
       const response = await fetch(url, {
         method: "POST",
         body: data,
         mode: "cors",
         headers: new Headers({
           "Content-Type": "application/json",
           APIKey: apiKey,
         }),
       });
       return await response.json();
     } catch (error) {
       return error;
     }
   }
   ```

### Troubleshooting

- Invalid API Key: Ensure the correct API key is set using `setAPIKey()` before making requests.
- URL Configuration: Verify that `BaseURL` is correctly set using `setURL()` to avoid connectivity issues.
- Error Responses: Check for proper request formatting; the request should be a valid JSON string for `postRequest()` to process correctly.

### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation provides an overview of the functions in `API_rms.js` for configuring and sending requests to the RMS API, ensuring streamlined firmware and configuration updates for MagTek devices.