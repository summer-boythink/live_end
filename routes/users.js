const router = require('koa-router')()
const {execsql,tomd5,generate_room,generate_code,exec} = require('../utils/index')
const redis = require('../db/redis_init');
const sendPhone = require('../utils/telephone')
const Jwt = require('../utils/jwt');

router.prefix('/users')

router.post('/sendPhone',async (ctx,next) => {
  // console.log(ctx.request.body);
  let {phone} = ctx.request.body
  let code = generate_code()
  await exec((res,rej) => {
    redis.set(phone,code,(err,data) => {
      res(data)
    })
  })
  await sendPhone(phone,code)
  // console.log(redis_set,res);
  ctx.body = {
    status:200,
    code:code
  }
})

router.post('/register',async (ctx,next) => {
  console.log(ctx.request.body);
  let {username,phone,password,captcha} = ctx.request.body;
  let md5pass = tomd5(password)
  let room = generate_room(phone,username)
  let checkUser = await execsql(`select * from user where user='${username}'`)
  if(checkUser.length > 0){
   return ctx.body = {
      status:404,
      message:"已注册"
    }
  }
  let code = await exec((res,rej) => {
    redis.get(phone,(err,data) => {
      res(data)
    })
  })

  if(code !== captcha){
    return ctx.body = {
          status:400,
          message:"fail"
        }
  }
  let res1 = await execsql(`insert into user (user,password,telephone,room_id) values ('${username}','${md5pass}','${phone}','${room}')`)
  let res2 = await execsql(`insert into room (id) values ('${room}')`)
  console.log(res1,code);
  if(res1.affectedRows > 0 && res2.affectedRows > 0){
    return ctx.body = {
      status:200,
      message:"success"
    }
  }else{
    return ctx.body = {
      status:500,
      message:"err"
    } 
  }  
})

router.post('/login',async (ctx,next) => {
  let {username,password} = ctx.request.body;
  password = tomd5(password);
  let data = await execsql(`select * from user where user='${username}' and password='${password}'`);
  console.log(data);
  if(data.length > 0){
    let user = data[0].user;
    console.log(user);
    let jwt = new Jwt(user);
    let token = jwt.generateToken();
    ctx.body = {
      status:200,
      token:token,
      message:"success"
    }
  }else{
    ctx.body = {
      status:400,
      message:"用户名或密码错误"
    }
  }
})


module.exports = router
