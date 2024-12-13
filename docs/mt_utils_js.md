This module provides utility functions essential for processing hexadecimal data, managing device logs, converting ASCII data, and parsing TLV (Tag-Length-Value) structures.

# MagTek Utility Functions - `mt_utils.js`

## Table of Contents
1. [Overview](#overview)
2. [Main Functions](#main-functions)
   - [Hexadecimal Conversion Functions](#hexadecimal-conversion-functions)
   - [TLV Parsing Functions](#tlv-parsing-functions)
   - [Utility Functions](#utility-functions)
3. [Troubleshooting](#troubleshooting)
4. [License](#license)

---

### Overview
This module provides utility functions essential for processing hexadecimal data, managing device logs, converting ASCII data, and parsing TLV (Tag-Length-Value) structures.

### Main Functions

#### Hexadecimal Conversion Functions

1. `toHexString(byteArray)`
   - Converts a byte array to a hexadecimal string.
   - Parameters: `byteArray` - Array of bytes.
   - Returns: A hexadecimal string.

   ```javascript
   export function toHexString(byteArray) {
     return Array.prototype.map.call(byteArray, function (byte) {
       return ("0" + (byte & 0xff).toString(16)).toUpperCase().slice(-2);
     }).join("");
   }
   ```

2. `AsciiToHex(str)`
   - Converts an ASCII string to hexadecimal.
   - Parameters: `str` - ASCII string.
   - Returns: Hexadecimal representation of the ASCII string.

3. `AsciiToHexPad(AsciiString, length)`
   - Pads an ASCII string, converts to hexadecimal, and truncates it to the specified length.
   - Parameters: `AsciiString`, `length`.
   - Returns: Hexadecimal string of specified length.

4. `hexToASCII(hexString)`
   - Converts a hexadecimal string to an ASCII string.
   - Parameters: `hexString`.
   - Returns: ASCII string.

5. `hexToBytes(hex)`
   - Converts a hexadecimal string to an array of bytes.
   - Parameters: `hex` - Hexadecimal string.
   - Returns: Array of bytes.

#### TLV Parsing Functions

1. `tlvParser(hexdata)`
   - Parses a hexadecimal string into a list of TLV (Tag-Length-Value) objects.
   - Parameters: `hexdata` - Hexadecimal data string.
   - Returns: Array of parsed TLV objects.

   ```javascript
   export function tlvParser(hexdata) {
     // Implementation logic
     return result; // Array of parsed TLV objects
   }
   ```

2. `getTagValue(tagName, defaultTagValue, tlvData, asASCII)`
   - Searches for a specific tag within TLV data and retrieves its value.
   - Parameters: `tagName`, `defaultTagValue`, `tlvData`, `asASCII`.
   - Returns: Tag value as ASCII or hexadecimal.

#### Utility Functions

1. `wait(ms)`
   - Pauses execution for the specified time in milliseconds.
   - Parameters: `ms` - Time in milliseconds.
   - Returns: A Promise that resolves after the specified delay.

2. `makeHex(value, sigDigits)`
   - Converts an integer value to a hexadecimal string with a specific number of significant digits.
   - Parameters: `value`, `sigDigits`.
   - Returns: Formatted hexadecimal string.

3. `makeid(length)`
   - Generates a random alphanumeric string.
   - Parameters: `length` - Desired string length.
   - Returns: Random string.

4. `getDefaultValue(key, defaultValue)` and `saveDefaultValue(key, value)`
   - Retrieves and saves default values in `localStorage`.
   - Parameters: `key`, `defaultValue` for `getDefaultValue`; `key`, `value` for `saveDefaultValue`.

5. `debugLog(data)`
   - Logs debug information. Currently, it’s a placeholder for console logs.

6. `filterString(inputString)`
   - Removes any non-alphanumeric characters from a string.
   - Parameters: `inputString`.
   - Returns: Filtered string.

7. `zeroFill(len)`
   - Array prototype function to fill the array with zeros up to a specified length.

   ```javascript
   Array.prototype.zeroFill = function (len) {
     for (let i = this.length; i < len; i++) {
       this[i] = 0;
     }
     return this;
   };
   ```

### Troubleshooting

- Invalid Hex String: Ensure input strings are valid hexadecimal values.
- TLV Parsing Errors: Verify that TLV data follows the standard format, as incorrect formatting may lead to parsing errors.
  
### License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation provides the essential details to understand and use the `mt_utils.js` utility functions effectively in the MagTek device integration process.