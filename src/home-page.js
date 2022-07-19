// src\home-page.js

import Util from './util.js';
import * as axios from 'axios';

// Retrieves the home page from cahe or web
// Requires cookies c_user and xs
// Provides params fb_dtsg, deviceId and rsrc script urls
class HomePage {

  static data = {
    fetchTime: null,
    content: null
  };
  
  static async init(Store) {
    console.log("\nHomePage.init()");
    return (
      await Util.readFile(Store.config.cache.homePage, Store, this.data) &&
      this.extractParams(Store) &&
      this.extractRsrcScriptUrls(Store)
    );
  }

  static async run(Store) {
    return (
      await this.makeRequest(Store) &&
      this.extractParams(Store) &&
      this.extractRsrcScriptUrls(Store) &&
      await Util.writeFile(Store.config.cache.homePage, JSON.stringify(this.data), Store)
    );
  }

  static async makeRequest(Store) {
    console.log("\nHomePage.makeRequest()");
    const maxTries = 3;
    let response = null;
    let numTries = 0;

    do {
      try {
        console.log("attempt "+(++numTries)+"...");
        response = await axios.get(Store.config.host, {
          headers: { 'Cookie': `c_user=${Store.cookies.c_user}; xs=${Store.cookies.xs}` }
        });
        console.log("response:", response.status);
        console.log("data length:", response.data.length);
      } catch (err) {
        console.log("HTTP get request to "+Store.config.host+" failed\n", err);
        continue;
      }
    } while ((!response || !response.data) && numTries < maxTries);
    if (response.data.length === 0) return false;

    this.data.fetchTime = Date.now();
    this.data.content = response.data;

    return true;
  }

  static extractParams(Store) {
    let pattern = /(DTSGInitialData",\[\],{"token":")([^"]+)/;
    Store.params.fb_dtsg = this.data.content.match(pattern)[2];
    console.log("fb_dtsg:", Store.params.fb_dtsg);
    
    pattern = /clientID":"([^"]+)/;
    Store.params.deviceId = this.data.content.match(pattern)[1];
    console.log("deviceId:", Store.params.deviceId);

    return (Store.params.fb_dtsg && Store.params.deviceId);
  }

  static extractRsrcScriptUrls(Store) {
    const pattern = /[^"]+rsrc\.php\/[^\.]+\.js\?[^"]+/g;
    let urls = [];

    const matches = this.data.content.matchAll(pattern);
    for (const match of matches) {
      urls.push(match[0]);
    }
    if (urls.length === 0) {
      console.error("Unable to extract rsrc script urls from body of home page.");
      return false;
    }

    Store.rsrcScriptUrls = urls;
    console.log("rsrc script urls:", Store.rsrcScriptUrls.length);

    return true;
  }
}

export default HomePage;

