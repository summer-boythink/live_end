const Client = require('aliyun-api-gateway').Client;
const client = new Client('203862859','w6H1AuQY29s8bUNVCP2JeF9ANvpeN2zb');

async function post(tele,num) {
  return new Promise(async (res,rej) => {
    var url = `http://yzxyzm.market.alicloudapi.com/yzx/verifySms?phone=${tele}&templateId=TP18040314&variable=code%3A${num}`;
    let appcode = 'f93d0cdcf60041d18aa07ae71d34c924'
    var result = await client.post(url, {
      data: {
        'testtest': 'query1Value'
      },
      headers: {
          AuthorizationAPPCODE:appcode
      }
    });
    // console.log(JSON.parse(result));
    res(JSON.parse(result))
    })
  
}

module.exports = post