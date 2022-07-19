// src\store.js

import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import * as bigInt from 'big-integer';

class Store {
  
  static user = {
    email: null,
    password: null,
    message: null,
    recipientId: null,
    refetchLoginPage: false,
    refetchLoginResponse: false,
    refetchHomePage: false,
    refetchRsrcScripts: false,
    refetchInboxScript: false
  };

  static config = {
    host: 'https://www.messenger.com/',
    loginPath: 'login/password/',
    apiPath: 'api/graphql',
    cache: {
      path: '../cache',
      loginPage: 'login-page.html.cache',
      loginResponse: 'login-response.json.cache',
      homePage: 'home-page.html.cache',
      rsrcScripts: 'rsrc-scripts.js.cache',
      inboxScript: 'inbox-script.js.cache'
    }
  };

  static params = {
    initial_request_id: null, //login
    lsd: null, //login
    fb_dtsg: null, //conversations
    deviceId: null, //conversations
    version: null, //conversations
    doc_id: null //conversations
  };

  static cookies = {
    datr: null, //login
    c_user: null, //session
    xs: null //session
  };
  static rsrcScriptUrls = [];
  static conversations = [];

  static initUserVars() {
    
    this.readEnvFileVars();
    
    if (!this.parseCommandLineArgs()) return false;

    console.log("username:", this.user.email);
    console.log("password:", this.user.password);
    console.log("message:", this.user.message);
    console.log("recipientId:", this.user.recipientId);
    console.log("doRefetchLoginPage:", this.user.refetchLoginPage);
    console.log("doRefetchLoginResponse:", this.user.refetchLoginResponse);
    console.log("doRefetchHomePage:", this.user.refetchHomePage);
    console.log("doRefetchRsrcScripts:", this.user.refetchRsrcScripts);
    console.log("doRefetchInboxScript:", this.user.refetchInboxScript);
    
    return this.validateUserVars();
  };

  static validateUserVars() {
    if (!this.user.email || !this.user.password) {
      console.log("Required parameters missing. Please update the .env file or use the following parameters: -u username and -p password.");
      return false;
    }
    if (this.user.message && !this.user.recipientId || !this.user.message && this.user.recipientId) {
      console.log("Missing parameter for sending message. Both -m message and -r recipientId must be provided.");
      return false;
    }
  
    return true;
  };

  static readEnvFileVars() {
    this.user.email = process.env.EMAIL;
    this.user.password = process.env.PASSWORD;
  };
  
  static parseCommandLineArgs() {
  
    for (let i=2; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case '-u':
          this.user.email = process.argv[++i];
          break;
        case '-p':
          this.user.password = process.argv[++i];
          break;
        case '-m':
          this.user.message = process.argv[++i];
          break;
        case '-r':
          this.user.recipientId = bigInt(process.argv[++i].toString());
          break;
        case '-rl':
          this.user.refetchLoginPage = true;
          break;
        case '-rr':
          this.user.refetchLoginResponse = true;
          break;
        case '-rh':
          this.user.refetchHomePage = true;
          break;
        case '-rs':
          this.user.refetchRsrcScripts = true;
          break;
        case '-ri':
          this.user.refetchInboxScript = true;
          break;
        default:
          console.log(`Usage: node app.js -<flag> <value>`);
          console.log("-u username/email (required)");
          console.log("-p password (required)");
          console.log("-m message");
          console.log("-r recipientId");
          console.log("-rl Refetch login page from web instead of using cached data (default: false)");
          console.log("-rr Refetch login response from web instead of using cached data (default: false)");
          console.log("-rh Refetch home page from web instead of using cached data (default: false)");
          console.log("-rs Refetch rsrc scripts from web instead of using cached data (default: false)");
          console.log("-ri Refetch inbox script from web instead of using cached data (default: false)");
          return false;
      }
    }

    return true;
  }
};

export default Store;

