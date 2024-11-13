This module provides an EventEmitter utility to manage custom events, allowing for subscribing, emitting, and unsubscribing from events.

## Overview

The `EventEmitter` module provides a simple mechanism for subscribing to, emitting, and unsubscribing from custom events. It is a lightweight, self-contained implementation designed to allow different parts of the application to communicate without tight coupling.

## Usage

To use `EventEmitter`, register event listeners with `on`, trigger events with `emit`, and remove listeners with `off`.

### Methods

1. `on(eventName, listener)`
   - Subscribes a function to a specific event.
   - Parameters:
     - `eventName` - The name of the event to subscribe to.
     - `listener` - The function to call when the event is emitted.
   - Example:
     ```javascript
     EventEmitter.on("dataReceived", (data) => {
       console.log("Data received:", data);
     });
     ```

2. `emit(eventName, data)`
   - Emits an event, triggering all subscribed listeners for that event.
   - Parameters:
     - `eventName` - The name of the event to emit.
     - `data` - The data to pass to each listener.
   - Example:
     ```javascript
     EventEmitter.emit("dataReceived", { key: "value" });
     ```

3. `off(eventName, listener)`
   - Unsubscribes a function from a specific event.
   - Parameters:
     - `eventName` - The name of the event to unsubscribe from.
     - `listener` - The function to remove from the event's listener array.
   - Example:
     ```javascript
     const listener = (data) => console.log(data);
     EventEmitter.on("dataReceived", listener);
     EventEmitter.off("dataReceived", listener);
     ```

## Example Usage

```javascript
// Subscribe to an event
EventEmitter.on("dataUpdate", (data) => {
  console.log("Data updated:", data);
});

// Emit the event
EventEmitter.emit("dataUpdate", { name: "Sample Data" });

// Unsubscribe from the event
EventEmitter.off("dataUpdate", listener);
```

### Global Exposure

The `EventEmitter` module is exposed globally as `window.EventEmitter`, making it accessible throughout the application for convenient event management.

## License

```javascript
/* 
DO NOT REMOVE THIS COPYRIGHT
Copyright 2020-2024 MagTek, Inc.
...
*/
```

---

This documentation outlines the functionality of the `EventEmitter` module, including subscribing, emitting, and unsubscribing from events.