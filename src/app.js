// src\app.js

import fs from 'fs';
import qs from 'qs';
import * as acorn from 'acorn';
import bigInt from 'big-integer';

import Store from './store.js';
import LoginPage from './login-page.js';
import LoginResponse from './login-response.js';
import HomePage from './home-page.js';
import RsrcScripts from './rsrc-scripts.js';
import InboxScript from './inbox-script.js';
import ThreadScript from './thread-script.js';
import WS from './web-socket.js';
  

function printMenu() {
  console.log("Messeger");
  // print conversations
  // print 'press n for new message'
  // print 'press n to exit'
}

// *** How conversation data is fetched ***
// InboxScript.run() gets conversation data from web
// The function requires session cookies from LoginResponse and params from RsrcScripts and HomePage
// RsrcScripts requires script urls from HomePage
// HomePage requires session cookies from LoginResponse
// LoginResponse requires cookie and params from LoginPage
async function run() {

  if (!Store.initUserVars()) return;

  if (Store.user.refetchLoginPage || !await LoginPage.init(Store))
    if (!await LoginPage.run(Store))
      return;
  
  if (Store.user.refetchLoginResponse || !await LoginResponse.init(Store))
    if (!await LoginResponse.run(Store))
      return;

  if (Store.user.refetchHomePage || !await HomePage.init(Store))
    if (!await HomePage.run(Store))
      return; 

  if (Store.user.refetchRsrcScripts || !await RsrcScripts.init(Store))
    if (!await RsrcScripts.run(Store))
      return;
  
  if (Store.user.refetchInboxScript || !await InboxScript.init(Store))
    if (!await InboxScript.run(Store))
      return;

  //ThreadScript.makeRequest(Store);
  //ThreadScript.getUrls(Store);

  //WS.run(Store);

  if (Store.user.message && Store.user.recipientId) {
    await sendMessage();
  }
}

function getName() {

  
}

async function sendMessage() {
  console.log("\nsendMessage()");
  const timestamp = Date.now();
  const epoch = timestamp << 22;
  //const otid = epoch + 0; // TODO replace with randomInt(0, 2**22)
  const otid = epoch + Math.floor(Math.random() * 4194304);
  console.log("timestamp:", timestamp);
  console.log("timestamp:", timestamp);
  console.log("epoch:", epoch);
  console.log("otid:", otid);  

  const variables = JSON.stringify({
    'deviceId': Store.params.deviceId,
    'requestId': 0,
    'requestPayload': JSON.stringify({
      'version_id': Store.params.version, // was '5710290875672189'
      'tasks': [
        {
          'label': '46', // id for 'send message'
          'payload': JSON.stringify({
            'thread_id': Store.user.recipientId.toString(), // was 612305952
            'otid': otid.toString(), // was '6945771336828502081'
            'source': 0, // was 65541
            'send_type': 1,
            'text': Store.user.message,
            'initiating_source': 1
          }),
          'queue_name': Store.user.recipientId.toString(), // was '612305952',
          'task_id': 0, // was 17
          'failure_count': null
        },
        {
          'label': '21', // id for 'update last read indicator'
          'payload': JSON.stringify({
            'thread_id': Store.user.recipientId.toString(), // was 612305952
            'last_read_watermark_ts': timestamp,
            'sync_group': 1
          }),
          'queue_name': Store.user.recipientId.toString(), // was '612305952'
          'task_id': 1, // was 18
          'failure_count': null
        }
      ],
      'epoch_id': epoch, // was 6945771337157189816
      'data_trace_id': '#oLSqS1lxSdmG1azAMAGz7A'
    }),
    'requestType': 3 // to match type: 3 in websocket message
  });
  console.log(Store.user.message);
  const options = {
    method: 'post',
    url: Store.config.host + Store.config.apiPath,
    headers: {
      'accept': '*/*',
      'user-agent': 'www.messenger.com',
      'content-type': 'application/x-www-form-urlencoded',
      'cookie': `c_user=${Store.cookies.c_user}; xs=${Store.cookies.xs}`
    },
    data: `fb_dtsg=${Store.params.fb_dtsg}&doc_id=${Store.params.doc_id}&variables=${variables}`
  };

  const response = await axios(options)
  .then(res => res)
  .catch(err => console.error("Error performing send message request.\n", err));

  console.log("RESPONSE\n", response);
}

run();

