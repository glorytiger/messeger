// src\util.js

const fs = require('fs');

class Util {

  static async readFile(name, Store) {
    const path = `${Store.config.cache.path}\\${name}`;
    let data = {
      fetchTime: null,
      content: null
    };

    try {
      const res = JSON.parse(await fs.readFileSync(path, 'utf8'));
      data.fetchTime = parseInt(res.fetchTime);
      data.content = res.content;
      if (!Number.isInteger(data.fetchTime)) {
        throw("Expected UNIX timestamp on the first line of the file");
      }
    } catch (err) {
      console.error("Unable to read cache file "+path+"\n", err);
      return null;
    }
    
    return data;
  }

  static writeFile(name, data, Store) {
    const path = `${Store.config.cache.path}\\${name}`;
    
    fs.writeFileSync(path, data, err => {
      if (err) {
        console.error("Unable to write cache file "+path+"\n", err);
      }
    });
  }

  static timeConverter(timestamp) {
    const a = new Date(timestamp);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours();
    const min = a.getMinutes();
    const sec = a.getSeconds();

    const time = `${date}.${month}.${year} ${hour}:${min}:${sec}`;
    
    return time;
  }
}

module.exports = Util;

