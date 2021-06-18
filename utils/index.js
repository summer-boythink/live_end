const db = require('../db/mysql_init')
const crypto = require('crypto')

exports.execsql = function (sql){
    return new Promise((res,rej) => {
        db.query(sql,function (err,data){
            if(err){
                console.log(err);
            }else{
                res(data)
            }
        })
    })
}

exports.exec = function (f) {
    return new Promise((res,rej) => {
        f(res,rej)
    })
}


exports.tomd5 = function(str){
    let obj = crypto.createHash('md5')
    obj.update(str)
    return obj.digest('hex')
}

exports.generate_room = function(telephone,user){
    // console.log(typeof telephone);
    let a = telephone.slice(2,5)
    return a+user+"qox"
}

exports.generate_code = function(){
    let code = "";
    for(let i = 0;i<4;i++){
        code += Math.ceil(Math.random()*10)-1
    }
    return code
}

exports.isFormData = function(req){
    let type = req.headers['content-type'] || ''
    return type.includes('multipart/form-data')
  }