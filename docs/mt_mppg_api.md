This Javascript interfaces with the Magensa MPPGv4WebAPI to facilitate processing of sales transactions using MagTek card readers. It provides methods for configuring API credentials, setting up transaction parameters, and sending transaction data.


# MagTek MPPG API Interface - `mt_mppg_api.js`

## Table of Contents
1. [Overview](#overview)
2. [Global Variables](#global-variables)
3. [Configuration Functions](#configuration-functions)
4. [Transaction Processing Functions](#transaction-processing-functions)
5. [Helper Functions](#helper-functions)
6. [Troubleshooting](#troubleshooting)
7. [License](#license)

---

### Overview
This module provides functions for configuring and processing transactions through the MagTek MPPG (MultiPay Processing Gateway) API. It includes methods for setting up credentials, customizing transaction parameters, and sending transaction requests to the MPPG endpoint.

### Global Variables

- `BaseURL`: Default URL for the MPPG API, initially set to `"https://rms.magensa.net/Test/Magensa/MPPGv4WebAPI"`.
- `ProcessorName`: Default processor name, set to `"TSYS - Pilot"`.
- `CustCode`: Customer code for authentication.
- `Username`: Username for authentication.
- `Password`: Password for authentication (not exported for security).

### Configuration Functions

1. `setURL(url)`
   - Sets the `BaseURL` for API requests.
   - Parameters: `url` - Base URL as a string.

   ```javascript
   export function setURL(url) {
     BaseURL = url;
   }
   ```

2. `setProcessorName(name)`
   - Sets the `ProcessorName` for transaction processing.
   - Parameters: `name` - Name of the processor.

3. `setCustCode(name)`
   - Sets the `CustCode` used in transaction authentication.
   - Parameters: `name` - Customer code.

4. `setUsername(name)`
   - Sets the `Username` used in transaction authentication.
   - Parameters: `name` - Username.

5. `setPassword(password)`
   - Sets the `Password` used in transaction authentication.
   - Parameters: `password` - Password for authentication.

### Transaction Processing Functions

1. `ProcessSale(amount, email, sms)`
   - Processes a sale transaction with specified amount details, email, and SMS information.
   - Parameters:
     - `amount` - Object containing `SubTotal`, `Tax`, `Tip`, and `CashBack` values.
     - `email` - Email address for sending a receipt.
     - `sms` - Phone number for SMS receipt.
   - Returns: JSON response from the MPPG API or an error if the transaction fails.

   ```javascript
   export async function ProcessSale(amount, email, sms) {
     try {
       let req = {
         ProcessorName: ProcessorName,
         TransactionNumber: "20220921104243",
         TransactionType: 1,
         Authentication: {
           CustomerCode: CustCode,
           Password: Password,
           Username: Username
         },
         Amount: amount,
         DataCaptureType: 6,
         ARQC: window.ARQCData,
         SendReceiptTo: {
           SMS: sms,
           Email: {
             To: email,
             Subject: "Customer Receipt"
           }
         }
       };
       return await PostProcessTransaction(req);
     } catch (error) {
       return error;
     }
   }
   ```

### Helper Functions

1. `PostProcessTransaction(request)`
   - Helper function to send a transaction request to the MPPG API.
   - Parameters: `request` - JSON object containing transaction data.
   - Returns: JSON response from the MPPG API.

2. `postRequest(url, data)`
   - Generalized function to handle HTTP POST requests to the specified URL.
   - Parameters:
     - `url` - API endpoint URL.
     - `data` - Request payload as a JSON string.
   - Returns: JSON response or error if the request fails.

   ```javascript
   async function postRequest(url, data) {
     try {
       const response = await fetch(url, {
         method: "POST",
         body: data,
         mode: "cors",
         headers: new Headers({
           "Content-Type": "application/json"
         }),
       });
       return await response.json();
     } catch (error) {
       return error;
     }
   }
   ```

### Troubleshooting

- Incorrect URL: Ensure `BaseURL` is correctly set using `setURL()` for each environment.
- Authentication Errors: Confirm that `CustCode`, `Username`, and `Password` are correctly set before initiating transactions.
- Network Issues: Ensure that CORS and network permissions are properly configured for API communication.

### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation provides an overview of the configuration and transaction functions in `mt_mppg_api.js` for securely processing transactions through the MPPG API.