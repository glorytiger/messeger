// src\loginResponse.js

const Util = require('./util.js');

const axios = require('axios');
const qs = require('qs');

class LoginResponse {

  static data = {
    fetchTime: null,
    content: null
  };

  static async init(Store) {
    console.log("\nLoginResponse.init()");
    let res = null;

    res = await Util.readFile(Store.config.cache.loginResponse, Store);
    if (!res) return false;
    this.data = res;

    res = this.extractCookies(Store);
    if (!res) return false;

    return true;
  }

  static async run(Store) {
    let res = false;
    
    res = await this.makeRequest(Store);
    if (!res) return false;

    res = await this.extractCookies(Store);
    if (!res) return false;

    res = await Util.writeFile(Store.config.cache.loginResponse, JSON.stringify(this.data), Store);
    if (!res) return false;

    return true;
  }

  static async makeRequest(Store) {
    console.log("\nLoginResponse.makeRequest()");
    const maxTries = 3;
    const body = qs.stringify({
      'initial_request_id': Store.params.initialRequestId,
      'lsd': Store.params.lsd,
      'email': Store.user.email,
      'pass': Store.user.password
    });
    const config = {
      method: 'post',
      url: Store.config.host+Store.config.loginPath,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `datr=${Store.params.datr}`
      },
      data: body,
      maxRedirects: 0
    };
    let response = null;
    let numTries = 0;

    do {
      console.log("attempt "+(++numTries)+"...");
      response = await axios(config)
      .then(res => new Error("Expected status code 302"))
      .catch(err => {
        if (err.response.status !== 302) {
          console.error("HTTP get request to "+(Store.config.host+Store.config.loginPath)+" failed\n", err);
        }
        return err.response;
      });
    } while ((!response || !response.headers) && numTries < maxTries);
    if (!response.headers) return false;
    
    this.data.fetchTime = Date.now();
    this.data.content = response.headers;
   
    return true;
  }

  static extractCookies(Store) {
    
    let regexp = /c_user=([^;]+)/;
    Store.cookies.c_user = this.data.content['set-cookie'][0].match(regexp)[1];
    regexp = /xs=([^;]+)/;
    Store.cookies.xs = this.data.content['set-cookie'][1].match(regexp)[1];
    console.log("c_user:", Store.cookies.c_user);
    console.log("xs:", Store.cookies.xs);

    return (Store.cookies.c_user && Store.cookies.xs);
  }
}

module.exports = LoginResponse;

