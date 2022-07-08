// src\loginPage.js

const Util = require('./util.js');
const axios = require('axios');

// Retrieves the login page from cache or web
// Extracts params initial_request_id, lsd and datr
class LoginPage {
  
  static data = {
    fetchTime: null,
    content: null
  };
  
  static async init(Store) {
    console.log("\nLoginPage.init()");
    return (
      await Util.readFile(Store.config.cache.loginPage, Store, this.data) &&
      this.extractParams(Store)
    );
  }

  static async run(Store) {
    return (
      await this.makeRequest(Store) &&
      await this.extractParams(Store) &&
      await Util.writeFile(Store.config.cache.loginPage, JSON.stringify(this.data), Store)
    );
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
    Store.params.initial_request_id = result.id;
    console.log("initialRequestId:", Store.params.initial_request_id);

    pattern = /name="lsd" value="(?<lsd>\w+)/;
    result = this.data.content.match(pattern).groups;
    Store.params.lsd = result.lsd;
    console.log("lsd:", Store.params.lsd);

    pattern = /"_js_datr","(?<datr>[^"]+)"/;
    result = this.data.content.match(pattern).groups;
    Store.cookies.datr = result.datr;
    console.log("datr:", Store.cookies.datr);

    return (Store.params.initial_request_id && Store.params.lsd && Store.cookies.datr);
  }
}

module.exports = LoginPage;

