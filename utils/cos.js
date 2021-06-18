const COS = require('cos-nodejs-sdk-v5');

let cos = new COS({
    SecretId: 'AKIDCBG56RQfQ5ewyfdZQXP1RagneG53ihNv',
    SecretKey: 'USB23yqTP7ZmuzoNhtPffh67rKlltlls'
});

module.exports = cos
