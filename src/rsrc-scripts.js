// src\rsrc-scripts.js

const Util = require('./util.js');

const axios = require('axios');

class RsrcScripts {

  static data = {
    fetchTime: null,
    content: null
  };

  static async init(Store) {
    console.log("\nRsrcScripts.init()");
    let res = null;

    res = await Util.readFile(Store.config.cache.rsrcScripts, Store);
    if (!res) return false;
    this.data = res;

    return this.extractParams(Store);
  }

  static async run(Store) {
    return (
      await this.makeRequest(Store) &&
      this.extractParams(Store) &&
      await Util.writeFile(Store.config.cache.rsrcScripts, JSON.stringify(this.data), Store)
    );
  }

  static async makeRequest(Store) {
    console.log("\nRsrcScripts.makeRequest()");
    const maxTries = 3;
    let scripts = [];
    let numTries = 0;

    do {
      scripts = [];
      console.log("attempt "+(++numTries)+"...");
      for (const url of Store.rsrcScriptUrls) {
        const result = await axios.get(url)
        .then(res => res.data)
        .catch(err => console.error(err));
        scripts.push(result);
      }
    } while (scripts.length < Store.rsrcScriptUrls.length && numTries < maxTries);
    
    console.log("rsrc scripts downloaded:", scripts.length, "/", Store.rsrcScriptUrls.length);

    this.data.fetchTime = Date.now();
    this.data.content = '';
    for (const script of scripts) {
      this.data.content += script;
    }
    console.log("total data length:", this.data.content.length);
    
    return true;
  }

  static extractParams(Store) {
    let pattern = /"LSVersion"[^}"]+"([\d]+)/;
    Store.params.version = this.data.content.match(pattern)[1];
    console.log("version:", Store.params.version);

    pattern = /LSPlatformGraphQLLightspeedRequestQuery"[^{]+{id:"(\d+)/;
    Store.params.doc_id = this.data.content.match(pattern)[1];
    console.log("doc_id:", Store.params.doc_id);
    
    return (Store.params.version && Store.params.doc_id);
  }
}

module.exports = RsrcScripts;

