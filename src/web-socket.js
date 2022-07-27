// src\web-socket.js

import WebSocket from 'ws';

class WS {

  static ws;

  static async init(Store) {
    console.log("\nWebSocket.init()");
    
    // TODO: load cache

    // TODO: extract thread data

    return false;
  }

  static async openConnection() {
    console.log('\nopenConnection()');

    this.ws = new WebSocket('wss://edge-chat.messenger.com/chat?region=pnb&sid=3474946028208127&cid=36a65bac-2d17-4871-9529-b712029ae937', {

    });

    this.ws.on('error', (error) => {
      console.error('ws error:', error);
    });
  
    this.ws.on('open', () => {
      console.log("ws open");
    });

    this.ws.on('message', (data) => {
      console.log('ws message:', data);
    });

    this.ws.on('ping', () => {
      console.log("ws ping");
    });

    this.ws.on('close', () => {
      console.log("close");
    });
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

export default WS;

