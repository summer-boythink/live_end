const redis = require('redis');

const client = redis.createClient({
    host:'121.5.118.127'
});

client.on("error",err => {  
    console.error(err)
})

module.exports = client;