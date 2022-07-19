// src\web-socket.js

import webSocket from 'ws';

class WebSocket {

  static async init(Store) {
    console.log("\nWebSocket.init()");
    
    // TODO: load cache

    // TODO: extract thread data

    return false;
  }

  static async openConnection() {
    console.log('\nopenConnection()');

  }

  static async run() {

    // TODO: source parameters
    
    this.openConnection();

    // TODO: maintain connection

    // TODO: send message request for thread data

    // TODO: listen for message responses

    // TODO: extract thread data

    return false;
  }
}

export default WebSocket;

