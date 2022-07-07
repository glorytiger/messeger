// src\inbox-script.js

const Util = require('./util.js');
const Visitor = require('./ast-visitor.js');

const axios = require('axios');
const acorn = require('acorn');
const bigInt = require('big-integer');

class InboxScript {
  
  static data = {
    fetchTime: null,
    content: null
  };
  static ast = null;

  static async init(Store) {
    console.log("\nInboxScript.init()");
    let res = null;

    res = await Util.readFile(Store.config.cache.inboxScript, Store);
    if (!res) return false;
    this.data = res;

    return this.extractConversations(Store);
  }

  static async run(Store) {
    return (
      await this.makeRequest(Store) &&
      this.extractConversations(Store) &&
      await Util.writeFile(Store.config.cache.inboxScript, JSON.stringify(this.data), Store)
    );
  }

  static async makeRequest(Store) {
    console.log("\nInboxScript.makeRequest()");
    let inboxScript = '';

    const options = {
      method: 'post',
      url: Store.config.host + Store.config.apiPath,
      headers: {
        'accept': '*/*',
        'user-agent': 'www.messenger.com',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': `c_user=${Store.cookies.c_user}; xs=${Store.cookies.xs}`
      },
      data: `fb_dtsg=${Store.params.fb_dtsg}&doc_id=${Store.params.doc_id}&variables=%7B%22deviceId%22%3A%22${Store.params.deviceId}%22%2C%22requestId%22%3A0%2C%22requestPayload%22%3A%22%7B%5C%22database%5C%22%3A1%2C%5C%22version%5C%22%3A${Store.params.version}%2C%5C%22sync_params%5C%22%3A%5C%22%7B%5C%5C%5C%22locale%5C%5C%5C%22%3A%5C%5C%5C%22en_GB%5C%5C%5C%22%7D%5C%22%2C%5C%22last_applied_cursor%5C%22%3Anull%7D%22%2C%22requestType%22%3A1%7D`
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
    if (inboxScript.length === 0){
      console.log("Recieved empty inbox script. Unable to continue");
      return false;
    }
    console.log("script length:", inboxScript.length);
    
    this.data.fetchTime = Date.now();
    this.data.content = inboxScript;

    return true;
  }

  static async extractConversations(Store) {
    console.log("\nInboxScript.extractConversations()");

    // Create an Abstrax Syntax Tree (AST) from the script
    this.ast = acorn.parse(this.data.content, { ecmaVersion: 2020 });

    const visitor = new Visitor();
    visitor.visitNode(this.ast);
    console.log("tree size:", visitor.count);

    let lsFuncValues = [];
    for (const func of visitor.lsFuncsRaw) {
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
      lsFuncValues.push(entry);
      //if (func.arguments[0].value === 'verifyContactRowExists')
        //console.log(entry);
    }
  
    for (const value of lsFuncValues) {
      if (value[0] === 'deleteThenInsertThread') {
        const lastSentTs = bigInt(value[1]);
        const lastReadTs = bigInt(value[2]);
        const lastMsg = value[3];
        const iconUrl = value[5];
        const userId = bigInt(value[8]);
        const userName = '';
        const lastMsgUserId = bigInt(value[18]);
        const lastMsgUserName = '';
        Store.conversations.push({
          withUserId: userId, withUserName: userName, isUnread: lastSentTs.neq(lastReadTs), lastMessage: lastMsg, lastMessageUserId: lastMsgUserId, lastMessageUserName: lastMsgUserName
        });
      }
    }

    // Add user name to Conversations
    for (const value of lsFuncValues) {
      if (value[0] === 'verifyContactRowExists') {
        const id = value[1];
        const name = value[4];
        for (const entry of Store.conversations) {
          if (entry.withUserId.eq(id) === true) {
            entry.withUserName = name;
          }
          if (entry.lastMessageUserId.eq(id)) {
            entry.lastMessageUserName = name;
          }
        }
      }
    }
  
    console.log(Store.conversations);
  }
}

module.exports = InboxScript;

