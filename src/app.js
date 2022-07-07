// src\app.js

require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const fs = require('fs');
const qs = require('qs');
const acorn = require('acorn');
const bigInt = require('big-integer');

const Store = require('./store.js');
const LoginPage = require('./login-page.js');
const LoginResponse = require('./login-response.js');
const HomePage = require('./home-page.js');
const RsrcScripts = require('./rsrc-scripts.js');
const InboxScript = require('./inbox-script.js');

let Conversations = [];

function printMenu() {
  console.log("Messeger");
  // print conversations
  // print 'press n for new message'
  // print 'press n to exit'
}

async function run() {

  if (!Store.initUserVars()) return;

  if (!await LoginPage.init(Store)) return;
  
  if (!await LoginResponse.init(Store)) return;

  if (!await HomePage.init(Store)) return; 

  if (!await RsrcScripts.init(Store)) return;
  
  if (!await InboxScript.run(Store)) return;
  return;


  if (Data.message && Data.recipientId) {
    await sendMessage();
  }
}

function getName() {

  
}

async function sendMessage() {
  console.log("sendMessage()\n");
  const timestamp = Date.now();
  const epoch = timestamp << 22;
  const otid = epoch + 0; // TODO replace with randomInt(0, 2**22)
  console.log("timestamp:", timestamp);
  console.log("epoch:", epoch);
  console.log("otid:", otid);  

  const variables = JSON.stringify({
    'deviceId': Data.deviceId,
    'requestId': 0,
    'requestPayload': JSON.stringify({
      'version_id': Data.version, // was '5710290875672189'
      'tasks': [
        {
          'label': '46', // id for 'send message'
          'payload': JSON.stringify({
            'thread_id': Data.recipientId.toString(), // was 612305952
            'otid': otid.toString(), // was '6945771336828502081'
            'source': 0, // was 65541
            'send_type': 1,
            'text': 'send message test',
            'initiating_source': 1
          }),
          'queue_name': Data.recipientId.toString(), // was '612305952',
          'task_id': 0, // was 17
          'failure_count': null
        },
        {
          'label': '21', // id for 'update last read indicator'
          'payload': JSON.stringify({
            'thread_id': Data.recipientId.toString(), // was 612305952
            'last_read_watermark_ts': timestamp,
            'sync_group': 1
          }),
          'queue_name': Data.recipientId.toString(), // was '612305952'
          'task_id': 1, // was 18
          'failure_count': null
        }
      ],
      'epoch_id': epoch, // was 6945771337157189816
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

  console.log("RESPONSE\n", response);
}

run();

