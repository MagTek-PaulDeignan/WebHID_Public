// 1. (Optional) Base Device Class for Abstraction
class AbstractDevice {
    open() {
        throw new Error("Method 'open()' must be implemented.");
    }
    close() {
        throw new Error("Method 'close()' must be implemented.");
    }
    send(data) {
        throw new Error("Method 'send(data)' must be implemented.");
    }
    receive() {
        throw new Error("Method 'receive()' must be implemented.");
    }
}

// 2. Concrete Device Classes
class USBDevice extends AbstractDevice {
    constructor(id) {
        super();
        this.id = id;
        console.log(`USB Device ${this.id} created.`);
    }

    open() {
        console.log(`USB Device ${this.id} opened.`);
        // Simulate device opening logic
        return true;
    }

    close() {
        console.log(`USB Device ${this.id} closed.`);
        // Simulate device closing logic
        return true;
    }

    send(data) {
        console.log(`USB Device ${this.id} sending: ${data}`);
        // Simulate sending data over USB
        return true;
    }

    receive() {
        const receivedData = `Data from USB Device ${this.id}`;
        console.log(`USB Device ${this.id} received: ${receivedData}`);
        // Simulate receiving data from USB
        return receivedData;
    }
}

class EthernetDevice extends AbstractDevice {
    constructor(ipAddress) {
        super();
        this.ipAddress = ipAddress;
        console.log(`Ethernet Device at ${this.ipAddress} created.`);
    }

    open() {
        console.log(`Ethernet Device at ${this.ipAddress} opened.`);
        return true;
    }

    close() {
        console.log(`Ethernet Device at ${this.ipAddress} closed.`);
        return true;
    }

    send(data) {
        console.log(`Ethernet Device at ${this.ipAddress} sending: ${data}`);
        return true;
    }

    receive() {
        const receivedData = `Data from Ethernet Device at ${this.ipAddress}`;
        console.log(`Ethernet Device at ${this.ipAddress} received: ${receivedData}`);
        return receivedData;
    }
}

class BluetoothDevice extends AbstractDevice {
    constructor(macAddress) {
        super();
        this.macAddress = macAddress;
        console.log(`Bluetooth Device ${this.macAddress} created.`);
    }

    open() {
        console.log(`Bluetooth Device ${this.macAddress} opened.`);
        return true;
    }

    close() {
        console.log(`Bluetooth Device ${this.macAddress} closed.`);
        return true;
    }

    send(data) {
        console.log(`Bluetooth Device ${this.macAddress} sending: ${data}`);
        return true;
    }

    receive() {
        const receivedData = `Data from Bluetooth Device ${this.macAddress}`;
        console.log(`Bluetooth Device ${this.macAddress} received: ${receivedData}`);
        return receivedData;
    }
}

class SerialDevice extends AbstractDevice {
    constructor(port) {
        super();
        this.port = port;
        console.log(`Serial Device on port ${this.port} created.`);
    }

    open() {
        console.log(`Serial Device on port ${this.port} opened.`);
        return true;
    }

    close() {
        console.log(`Serial Device on port ${this.port} closed.`);
        return true;
    }

    send(data) {
        console.log(`Serial Device on port ${this.port} sending: ${data}`);
        return true;
    }

    receive() {
        const receivedData = `Data from Serial Device on port ${this.port}`;
        console.log(`Serial Device on port ${this.port} received: ${receivedData}`);
        return receivedData;
    }
}

// 3. Class Factory Function
function createDevice(type, ...args) {
    switch (type.toLowerCase()) {
        case 'usb_mms':
            return new USBDevice(...args);
        case 'ethernet':
            return new EthernetDevice(...args);
        case 'bluetooth':
            return new BluetoothDevice(...args);
        case 'serial':
            return new SerialDevice(...args);
        default:
            throw new Error(`Unknown device type: ${type}`);
    }
}

// Usage
try {
    const usbDevice = createDevice('usb', 'DEV-001');
    usbDevice.open();
    usbDevice.send('Hello USB!');
    const usbData = usbDevice.receive();
    usbDevice.close();
    console.log('---');

    const ethernetDevice = createDevice('ethernet', '192.168.1.100');
    ethernetDevice.open();
    ethernetDevice.send('Ping!');
    const ethernetData = ethernetDevice.receive();
    ethernetDevice.close();
    console.log('---');

    const btDevice = createDevice('bluetooth', 'AA:BB:CC:DD:EE:FF');
    btDevice.open();
    btDevice.send('Pairing request');
    const btData = btDevice.receive();
    btDevice.close();
    console.log('---');

    const serialDevice = createDevice('serial', '/dev/ttyUSB0');
    serialDevice.open();
    serialDevice.send('AT command');
    const serialData = serialDevice.receive();
    serialDevice.close();
    console.log('---');

    // Example of an unknown device type
    // const unknownDevice = createDevice('wifi'); // This would throw an error
} catch (error) {
    console.error(error.message);
}