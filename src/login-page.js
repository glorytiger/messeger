// src\loginPage.js

const Util = require('./util.js');

const axios = require('axios');

class LoginPage {
  
  static data = {
    fetchTime: null,
    content: null
  };
  
  static async init(Store) {
    console.log("\nLoginPage.init()");
    let res = null;

    res = await Util.readFile(Store.config.cache.loginPage, Store);
    if (!res) return false;
    this.data = res;

    res = this.extractParams(Store);
    if (!res) return false;

    return true;
  }

  static async run(Store) {
    let res = false;
    
    res = await this.makeRequest(Store);
    if (!res) return false;

    res = await this.extractParams(Store);
    if (!res) return false;

    res = await Util.writeFile(Store.config.cache.loginPage, JSON.stringify(this.data), Store);
    if (!res) return false;

    return true;
  }

  static async makeRequest(Store) {
    console.log("\nLoginPage.makeRequest()");
    const maxTries = 3;
    let response = null;
    let numTries = 0;

    do {
      try {
        console.log("attempt "+(++numTries)+"...");
        response = await axios.get(Store.config.host);
        console.log("response:", response.status);
        console.log("data length:", response.data.length);
      } catch (err) {
        console.error("HTTP get request to "+Store.config.host+" failed\n", err);
        continue;
      }
    } while ((!response || !response.data) && numTries < maxTries);
    if (response.data.length === 0) return false;
    
    this.data.fetchTime = Date.now();
    this.data.content = response.data;

    return true;
  }

  static extractParams(Store) {
    let pattern = /name="initial_request_id" value="(?<id>\w+)"/;
    let result = this.data.content.match(pattern).groups;
    Store.params.initialRequestId = result.id;

    pattern = /name="lsd" value="(?<lsd>\w+)/;
    result = this.data.content.match(pattern).groups;
    Store.params.lsd = result.lsd;

    pattern = /"_js_datr","(?<datr>[^"]+)"/;
    result = this.data.content.match(pattern).groups;
    Store.params.datr = result.datr;

    return (Store.params.initialRequestId && Store.params.lsd && Store.params.datr);
  }
}

module.exports = LoginPage;

