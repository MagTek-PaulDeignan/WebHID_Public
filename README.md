<img src="https://github.com/user-attachments/assets/94e060e3-9244-4712-98fb-5913c5c334bb" width="150">

# WebHID_Public

Web HID Demo for MagTek Devices

[Live Demo](https://rms.magensa.net/Test/Demo/index.html)

---

## Overview

This project provides a browser-based interactive demo for connecting to and communicating with MagTek HID devices using the WebHID API and MagTek Messaging Schema (MMS). The demo supports device connection, command execution, USB status monitoring, and secure PIN entry, making it ideal for development, testing, and demonstration of MagTek hardware.

**Supported Devices:**
- DynaFlex I
- DynaFlex II (including Go and PED)
- DynaProx
- Other MagTek devices compatible with MMS

---

## Features

- **Device Connection:** Open and close connections to supported MagTek HID devices directly from the browser.
- **Command Execution:** Send individual or batch commands, either by manual entry, dropdown selection, or uploading command files.
- **USB Status Monitoring:** Real-time feedback on device connection status with visual indicators.
- **Secure PIN Pad:** On-screen PIN pad for secure and formatted PIN entry.
- **Logging:** View device responses and logs in the UI for troubleshooting and monitoring.
- **Batch Processing:** Automate device actions by uploading command scripts.

---

## Code Structure


- `js/mt_ui.js` – UI utilities for progress bars, logging, and connection status updates.
- `js/PINPad.js` – Implements the browser-based PIN pad for secure input.
- `css/site.css` – Custom styles for the demo interface.
- `cmds/` – Example command scripts for batch device operations.
- `docs/` – In-depth documentation for developers.

---

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/MagTek-PaulDeignan/WebHID_Public.git
   ```
2. **Open `index.html` in a supported browser** (such as Chrome) that enables the WebHID API.
3. **Connect your MagTek device** and use the on-screen buttons and forms to interact.

> **Note:** Some features require secure context (HTTPS) and user interaction to access HID devices.

---

## Documentation

- [HID MMS Demo Documentation](docs/Demo_HID_MMS.md) – Detailed overview, UI structure, and key functionalities.
- [MQTT JavaScript API Documentation](docs/Demo_V5_EMV_%20MQTT_js.md) – Technical details on the JavaScript implementation for MQTT-based device communication.

---

## License

```
Copyright 2020-2025 MagTek, Inc, Paul Deignan.

This software is provided "as is", without warranty of any kind. See source files for full license details.
```

---

## Credits

Developed and maintained by MagTek, Inc. For questions or support, please refer to the documentation or contact MagTek.
