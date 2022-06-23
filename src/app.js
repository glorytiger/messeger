// app.js

require('dotenv').config({ path: '../.env' });;
const axios = require('axios');
const fs = require('fs');
const qs = require('qs');
const acorn = require('acorn');
const bigInt = require('big-integer');

let Conversations = []

let Config = {
  host: 'https://www.messenger.com/',
  loginPath: 'login/password/',
  apiPath: 'api/graphql/',
  cachePath: '../cache',
  loginPageFileName: 'loginPage.html',
  loginResponseFileName: 'loginResponse.json',
  homePageFileName: 'homePage.html',
  rsrcScriptsFileName: 'rsrcScripts.js',
  inboxScriptFileName: 'inboxScript.js',
  doRefetchLoginPage: false,
  doRefetchLoginResponse: false,
  doRefetchHomePage: false,
  doRefetchRsrcScripts: false,
  doRefetchInboxScript: false,
};

let Data = {
  username: '',
  password: '',
  initialRequestId: '',
  lsd: '',
  datr: '',
  c_user: '', //login cookie
  xs: '', //login cookie
  sb: '', //login cookie
  fb_dtsg: '',
  deviceId: '',
  version: '',
  inboxAst: null,
  rsrcScripts: []
};

async function run() {

  if (!parseArguments()) return;
  if (await parseLoginPage() === false) return;
  if (await performLogin() === false) return;
  if (await getInboxParameters() === false) return;
  if (await getInboxContentScript() === false) return;
  //getConversations();
  await sendMessage();
}

async function sendMessage() {
  console.log("sendMessage()\n");
  
  const variables = JSON.stringify({
    'deviceId': Data.deviceId,
    'requestId': 0,
    'requestPayload': JSON.stringify({
      'version_id': '5710290875672189',
      'tasks': [
        {
          'label': '46',
          'payload': JSON.stringify({
            'thread_id': 612305952,
            'otid': '6945771336828502081',
            'source': 65541,
            'send_type': 1,
            'text': 'send message test',
            'initiating_source': 1
          }),
          'queue_name': '612305952',
          'task_id': 17,
          'failure_count': null
        },
        {
          'label': '21',
          'payload': JSON.stringify({
            'thread_id': 612305952,
            'last_read_watermark_ts': 1656000932891,
            'sync_group': 1
          }),
          'queue_name': '612305952',
          'task_id': 18,
          'failure_count': null
        }
      ],
      'epoch_id': 6945771337157189816,
      'data_trace_id': '#oLSqS1lxSdmG1azAMAGz7A'
    }),
    'requestType': 3 // to match type: 3 in websocket message
  });

  const options = {
    method: 'post',
    url: Config.host + Config.apiPath,
    headers: {
      'accept': '*/*',
      'user-agent': 'www.messenger.com',
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': `c_user=${Data.c_user}; xs=${Data.xs}`
    },
    data: `fb_dtsg=${Data.fb_dtsg}&doc_id=${Data.doc_id}&variables=${variables}`
  };

  const response = await axios(options)
  .then(res => res)
  .catch(err => console.error("Error performing send message request.\n", err));
}

class Visitor {
  constructor() {
    this.count = 0;
    this.lsFuncs = [];
  }
  visitNodes(nodes) { for (const n of nodes) this.visitNode(n); }
  visitNode(node) {
    if (node === null || node === undefined) return;
    this.count++;
    //console.log(node.type);

    // Append LS functions to array
    if (node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'LS' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'sp') {
      //console.log(node.arguments[0].value);
      this.lsFuncs.push(node);
    }

    /*for (const prop in node) {
      if (Object.prototype.hasOwnProperty.call(node, prop)) {
        if (Array.isArray(node.prop)) this.visitNodes(node.prop);
        else this.visitNode(node.prop);
      }
    }*/

    if (Array.isArray(node.body)) { this.visitNodes(node.body); }
    else if (node.body) { this.visitNode(node.body); }
    if (node.id) this.visitNode(node.id);
    if (node.declarations) this.visitNodes(node.declarations);
    if (Array.isArray(node.arguments)) this.visitNodes(node.arguments);
    else this.visitNode(node.argument);
    if (node.callee) this.visitNode(node.callee);
    if (node.params) this.visitNodes(node.params);
    if (node.init) this.visitNode(node.init);
    if (node.left) this.visitNode(node.left);
    if (node.right) this.visitNode(node.right);
    if (node.test) this.visitNode(node.test);
    if (node.consequent) this.visitNode(node.consequent);
    if (node.alternate) this.visitNode(node.alternate);
    if (node.expressions) this.visitNodes(node.expressions);
    if (node.object) this.visitNode(node.object);
    if (node.property) this.visitNode(node.property);
    if (node.elements) this.visitNodes(node.elements);
  }
}

function getConversations() {
  console.log("\ngetConversations");

  const visitor = new Visitor();
  visitor.visitNode(Data.inboxAst);
  console.log("tree size:", visitor.count);

  let lsDict = {};
  for (const func of visitor.lsFuncs) {
    //console.log(func);
    //console.log(func.arguments[0].value);
    let entry = [];
    for (const node of func.arguments) {
      if (node.type === 'Literal') {
        entry.push(node.value);
      } else if (node.type === 'ArrayExpression' && node.elements.length === 2) {
        // Convert 32bit number pair (high + low) to 64bit
        entry.push( bigInt(node.elements[0].value).shiftLeft(32).add(node.elements[1].value) );
      } else if (node.type === 'UnaryExpression' && node.prefix && node.operator === '-') {
        console.log("UNHANDLED TYPE:", console.log(node.argument));
      } else if (node.type === 'Identifier' && node.name === 'U') {
        if (node.name === 'U') {
          entry.push(undefined);
        } else {
          console.log("UNHANDLED IDENTIFIER", node);
        }
      } else {
        //console.log(node);
      }
    }
    lsDict[func.arguments[0].value] = entry;
  }
  
  for (const [key, value] of Object.entries(lsDict)) {
    if (key === 'deleteThenInsertThread') {
      const lastSentTs = bigInt(value[1]);
      const lastReadTs = bigInt(value[2]);
      const lastMsg = value[3];
      const iconUrl = value[5];
      const userId = bigInt(value[8]);
      const lastMsgUserId = bigInt(value[18]);
      Conversations.push({
        userId: userId, isUnread: lastSentTs.neq(lastReadTs), lastMessage: lastMsg, lastMessageUserId: lastMsgUserId
      });
    }
  }

  console.log(Conversations);
}

async function getInboxContentScript() {
  console.log("\ngetInboxContentScript()");
  let inboxScript = '';

  if (Config.doRefetchInboxScript === true) {
    const options = {
      method: 'post',
      url: Config.host + Config.apiPath,
      headers: {
        'accept': '*/*',
        'user-agent': 'www.messenger.com',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': `c_user=${Data.c_user}; xs=${Data.xs}`
      },
      data: `fb_dtsg=${Data.fb_dtsg}&doc_id=${Data.doc_id}&variables=%7B%22deviceId%22%3A%22${Data.deviceId}%22%2C%22requestId%22%3A0%2C%22requestPayload%22%3A%22%7B%5C%22database%5C%22%3A1%2C%5C%22version%5C%22%3A${Data.version}%2C%5C%22sync_params%5C%22%3A%5C%22%7B%5C%5C%5C%22locale%5C%5C%5C%22%3A%5C%5C%5C%22en_GB%5C%5C%5C%22%7D%5C%22%2C%5C%22last_applied_cursor%5C%22%3Anull%7D%22%2C%22requestType%22%3A1%7D`
    };

    const response = await axios(options)
    .then(res => res)
    .catch(err => console.error("Error performing request for inbox content.\n", err));

    console.log("response code:", response.status);
    if (response.status !== 200) {
      console.error("Unexpected response.\n", response);
      return false;
    }
    inboxScript = response.data["data"]["viewer"]["lightspeed_web_request"]["payload"];
    writeCacheFile(Config.inboxScriptFileName, JSON.stringify(inboxScript));
  }
  else {
    inboxScript = JSON.parse(await readCacheFile(Config.inboxScriptFileName));
  }
  console.log("script length:", inboxScript.length);

  Data.inboxAst = acorn.parse(inboxScript, { ecmaVersion: 2020 });

  return (inboxScript.length > 0);
}

async function getInboxParameters() {
  console.log("\ngetInboxParameters()");
  let body = '';

  // Get home page
  if (Config.doRefetchHomePage === true) {
    body = await axios.get(Config.host, {
      headers: { 'Cookie': `c_user=${Data.c_user}; xs=${Data.xs}` }
    })
    .then(res => {
      console.log("response status:", res.status);
      writeCacheFile(Config.homePageFileName, res.data);
      return res.data;
    })
    .catch(err => console.log("Error fetching home page.\n", err));
  } else {
    body = await readCacheFile(Config.homePageFileName);
  }
  if (body.length === 0) return false;
  
  // Get the fb_dtsg and deviceId parameters
  Data.fb_dtsg = body.match(/(DTSGInitialData",\[\],{"token":")([^"]+)/)[2];
  console.log("fb_dtsg:", Data.fb_dtsg);
  Data.deviceId = body.match(/clientID":"([^"]+)/)[1];
  console.log("deviceId:", Data.deviceId);

  // Get rsrc scripts
  if (Config.doRefetchRsrcScripts === true) {
    const matches = body.matchAll(/[^"]+rsrc\.php\/[^\.]+\.js\?[^"]+/g);
    let scripts = [];
    for (const match of matches) {
      const script = await axios.get(match[0])
      .then(res2 => res2.data)
      .catch(err2 => console.error("Error fetching rsrc script.\n", err2));
      scripts.push(script);
    }
    Data.rsrcScripts = scripts;
    writeToFile(Config.rsrcScriptsFileName, JSON.stringify(scripts));
    console.log("rsrc scripts:", Data.rsrcScripts.length);
  } else {
    Data.rsrcScripts = JSON.parse(await readCacheFile(Config.rsrcScriptsFileName));
  }
  if (Data.rsrcScripts.length === 0) return false;

  // Get the version parameter
  for (const script of Data.rsrcScripts) {
    const results = script.match(/"LSVersion"[^}"]+"([\d]+)/);
    if (results !== null) {
      Data.version = results[1];
      break;
    }
  }
  console.log("version:", Data.version);

  // Get the doc_id parameter
  for (const script of Data.rsrcScripts) {
    const results = script.match(/LSPlatformGraphQLLightspeedRequestQuery"[^{]+{id:"(\d+)/);
    if (results !== null) {
      Data.doc_id = results[1];
      break;
    }
  }
  console.log("doc_id:", Data.doc_id);

  return (Data.fb_dtsg.length > 0 && Data.deviceId.length > 0 && Data.version.length > 0 && Data.doc_id.length > 0);
}

async function performLogin() {
  console.log("\nperformLogin()");
  let response = '';

  // Perform login request
  if (Config.doRefetchLoginResponse === true) {
    const body = qs.stringify({
      'initial_request_id': Data.initialRequestId,
      'lsd': Data.lsd,
      'email': Data.username,
      'pass': Data.password
    });
  
    const config = {
      method: 'post',
      url: Config.host+Config.loginPath,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `datr=${Data.datr}`
      },
      data: body,
      maxRedirects: 0
    };

    response = await axios(config)
    .then(res => res)
    .catch(err => err.response); 
    if (response.status) {
      console.log("response status:", response.status);
    }
    if (response.status && response.status === 302) {
      // Ignore everything except headers to avoid circular structure error when stringifying
      writeCacheFile(Config.loginResponseFileName, JSON.stringify({ headers: response.headers }));
    } else {
      console.error("Error performing login request.");
      console.error("### Request ###\n", config);
      console.error("### Response ###\n", response);
      return false;
    }
  }
  else {
    response = JSON.parse(await readCacheFile(Config.loginResponseFileName));
  }
  if (response.length === 0) return false;
  
  // Extract cookies
  let regexp = /([^=]+=)([^;]+)/;
  Data.sb = response.headers['set-cookie'][0].match(regexp)[2];
  Data.c_user = response.headers['set-cookie'][1].match(regexp)[2];
  Data.xs = response.headers['set-cookie'][2].match(regexp)[2];
  console.log("sb:", Data.sb);
  console.log("c_user:", Data.c_user);
  console.log("xs:", Data.xs);

  return (Data.sb.length > 0 && Data.c_user.length > 0 && Data.xs.length > 0);
}

async function parseLoginPage(data) {
  console.log("\nparseLoginPage()");
  let body = '';

  // Get login page
  if (Config.doRefetchLoginPage === true) {
    body = await axios.get(Config.host).then(res => {
      console.log("response status:", res.status);
      writeCacheFile(Config.loginPageFileName, res.data);
      return res.data
    });
  } else {
    body = await readCacheFile(Config.loginPageFileName);
  }
  if (body.length === 0) return false;

  // Extract form attributes
  let pattern = /name="initial_request_id" value="(?<id>\w+)"/;
  let result = body.match(pattern).groups;
  Data.initialRequestId = result.id;
  console.log("initial_request_id: ", Data.initialRequestId);

  pattern = /name="lsd" value="(?<lsd>\w+)/;
  result = body.match(pattern).groups;
  Data.lsd = result.lsd;
  console.log("lsd: ", Data.lsd);

  pattern = /"_js_datr","(?<datr>[^"]+)"/;
  result = body.match(pattern).groups;
  Data.datr = result.datr;
  console.log("_js_datr: ", Data.datr);

  return (Data.initialRequestId.length > 0 && Data.lsd.length > 0 && Data.datr.length > 0);
}

async function readCacheFile(name) {
  const path = `${Config.cachePath}\\${name}`;
  try {
    return await fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.error("Unable to read cache file "+path+"\n", err);
    return null;
  }
}

function writeCacheFile(name, content) {
  const path = `${Config.cachePath}\\${name}`;
  fs.writeFile(path, content, err => {
    if (err) {
      console.error("Unable to write cache file "+path+"\n", err);
    }
  });
}

function parseArguments() {
  console.log("parseArguments()");
  
  for (let i=2; i < process.argv.length; i++) {
    switch (process.argv[i]) {
      case '-u':
        Data.username = process.argv[++i];
        break;
      case '-p':
        Data.password = process.argv[++i];
        break;
      case '-rl':
        Config.doRefetchLoginPage = true;
        break;
      case '-rr':
        Config.doRefetchLoginResponse = true;
        break;
      case '-rh':
        Config.doRefetchHomePage = true;
        break;
      case '-rs':
        Config.doRefetchRsrcScripts = true;
        break;
      case '-ri':
        Config.doRefetchInboxScript = true;
        break;
      default:
        console.log(`Usage: node app.js -<flag> <value>`);
        console.log("-u username/email (required)");
        console.log("-p password (required)");
        console.log("-rl Refetch login page from web instead of using cached data (default: false)");
        console.log("-rr Refetch login response from web instead of using cached data (default: false)");
        console.log("-rh Refetch home page from web instead of using cached data (default: false)");
        console.log("-rs Refetch rsrc scripts from web instead of using cached data (default: false)");
        console.log("-ri Refetch inbox script from web instead of using cached data (default: false)");
        return false;
    }
  }
  if (Data.username.length === 0 || Data.password.length === 0) {
    Data.username = process.env.USERNAME;
    Data.password = process.env.PASSWORD;
  }
  if (Data.username.length === 0 || Data.password.length === 0) {
    console.log("Required parameters missing. Please update the .env file or use the following parameters: -u username and -p password.");
    return false;
  }
  console.log("username:", Data.username);
  console.log("password:", Data.password);
  console.log("doRefetchLoginPage:", Config.doRefetchLoginPage);
  console.log("doRefetchLoginResponse:", Config.doRefetchLoginResponse);
  console.log("doRefetchHomePage:", Config.doRefetchHomePage);
  console.log("doRefetchRsrcScripts:", Config.doRefetchRsrcScripts);
  console.log("doRefetchInboxScript:", Config.doRefetchInboxScript);
  
  return true;
}

run();
