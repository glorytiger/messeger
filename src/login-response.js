// src\loginResponse.js

import Util from './util.js';

import axios from 'axios';
import * as qs from 'qs';

// Retrieves a login response from cache or web
// Requires params initial_request_id, lsd, email, pass and cookie datr
// Extracts cookies c_user and xs
class LoginResponse {

  static data = {
    fetchTime: null,
    content: null
  };

  static async init(Store) {
    console.log("\nLoginResponse.init()");
    return (
      await Util.readFile(Store.config.cache.loginResponse, Store, this.data) &&
      this.extractCookies(Store)
    );
  }

  static async run(Store) {
    return ( 
      await this.makeRequest(Store) &&
      this.extractCookies(Store) &&
      await Util.writeFile(Store.config.cache.loginResponse, JSON.stringify(this.data), Store)
    );
  }

  static async makeRequest(Store) {
    console.log("\nLoginResponse.makeRequest()");
    const maxTries = 3;
    const body = qs.stringify({
      'initial_request_id': Store.params.initial_request_id,
      'lsd': Store.params.lsd,
      'email': Store.user.email,
      'pass': Store.user.password
    });
    const config = {
      method: 'post',
      url: Store.config.host+Store.config.loginPath,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `datr=${Store.cookies.datr}`
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
      console.log("response:", response.status);
    } while ((!response || !response.headers) && numTries < maxTries);
    if (!response.headers) return false;
    
    this.data.fetchTime = Date.now();
    this.data.content = response.headers;
   
    return true;
  }

  static extractCookies(Store) {
    let regexp = /c_user=([^;]+)/;
    Store.cookies.c_user = this.data.content['set-cookie'][0].match(regexp)[1];
    console.log("c_user:", Store.cookies.c_user);
    
    regexp = /xs=([^;]+)/;
    Store.cookies.xs = this.data.content['set-cookie'][1].match(regexp)[1];
    console.log("xs:", Store.cookies.xs);

    return (Store.cookies.c_user && Store.cookies.xs);
  }
}

export default LoginResponse;

