// src\thread-script.js

import * as Util from './util.js';
import * as axios from 'axios';

class ThreadScript {

  static data = {
    fetchTime: null,
    content: null
  };

  static async init(Store) {
    console.log("\nThreadScript.init()");
  }

  static async run(Store) {
    return (
      await this.makeRequest(Store)
    );
  }

  // This is the decoded outgoing websocket message believed to trigger a response containing a 
  // specific conversation thread.
  //{
  //  "request_id":57,
  //  "type":3,
  //  "payload":"{\"version_id\":\"5071587662936754\",\"tasks\":[{\"label\":\"228\",\"payload\":\"{\\\"thread_key\\\":612305952,\\\"direction\\\":0,\\\"reference_timestamp_ms\\\":1656272249983,\\\"reference_message_id\\\":\\\"mid.$cAABbBmu3_8mH0sosf2BoYT-LtAfZ\\\",\\\"sync_group\\\":1}\",\"queue_name\":\"mrq.612305952\",\"task_id\":11,\"failure_count\":null}],\"epoch_id\":6951225278034963702,\"data_trace_id\":null}",
  //  "app_id":"772021112871879"
  //} 
  static async makeRequest(Store){
    console.log("\nThreadScript.makeRequest()");

    const variables = JSON.stringify({
      // Doesn't change between repeated requests for the same thread
      'deviceId': 772021112871879, //Store.params.deviceId,
      'requestId': 59, // changing didn't seem to matter
      'requestType': 3, // change to 0 returned error
      'requestPayload': JSON.stringify({
        'version_id': 5071587662936754, //Store.params.version,
        'tasks': [
          {
            'label': '228', // change to '21' returns a very small request
            'payload': JSON.stringify({
              'thread_key': 612305952, // or thread_id ? Store.user.recipientId.toString(),
              'direction': 0,
              'reference_timestamp_ms': 1656272249983,
              'reference_message_id': 'mid.$cAABbBmu3_8mH0sosf2BoYT-LtAfZ',
              'sync_group': 1
            }),
            // Doesn't change between repeated requests for the same thread
            'queue_name': 'mrq.612305952', //Store.user.recipientId.toString(),
            'task_id': 9, // change to 0 didn't seem to matter
            'failure_count': null
          }
        ],
        'epoch_id': 6951225278034963702, //epoch,
        'data_trace_id': null
      }),
    });

    const options = {
      method: 'post',
      url: Store.config.host + Store.config.apiPath,
      headers: {
        'accept': '*/*',
        'user-agent': 'www.messenger.com',
        'content-type': 'application/x-www-form-urlencoded',
        //'cookie': `c_user=${Store.cookies.c_user}; xs=${Store.cookies.xs}`
        'cookie': `c_user=100082666501097; xs=29%3AzkhFbrP2mfNrWQ%3A2%3A1657385597%3A-1%3A-1`
      },
      data: `fb_dtsg=NAcMvzTFkrjICsUxea5vUimum4BGKR7W1S6wYcyeYB3ttEOpS1P1RWg:29:1657385597&doc_id=${Store.params.doc_id}&variables=${variables}`
    };

    const response = await axios(options);
    if (response.status === 200) {
      console.log("data:", JSON.stringify(response.data));
    } else {
      console.log("invalid response\n", response);
    }
  }

  static async getUrls(Store) {
    const url1 = 'https://static.xx.fbcdn.net/rsrc.php/v3/y7/r/uSVFsqYJ7mJ.js?_nc_x=z7jwgw5_w57';
    const url2 = 'https://static.xx.fbcdn.net/rsrc.php/v3/yR/r/89I7-vvAKuT.js?_nc_x=z7jwgw5_w57';

    let response = await axios.get(url1);
    console.log("response:", response);
    if (response.status === 200) {
      console.log("\ndata:", JSON.stringify(response.data));
    }

    response = await axios.get(url2);
    console.log("response:", response);
    if (response.status === 200) {
      console.log("\ndata:", JSON.stringify(response.data));
    }
  }
}

export default ThreadScript;

