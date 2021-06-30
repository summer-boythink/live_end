const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const Jwt = require('./utils/jwt');
const cors = require('koa2-cors');


const index = require('./routes/index')
const users = require('./routes/users')
const room = require('./routes/room')
// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(cors());

app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// jwt
app.use(async (ctx,next) => {
  console.log(ctx.url.indexOf("/users"));
  if(ctx.url !=='/' && ctx.url.indexOf("users") === -1){
    if(ctx.headers['th-auth']){
        let token = ctx.headers['th-auth']  
        // console.log(token); 
        let jwt = new Jwt(token);
        let result = jwt.verifyToken();
        console.log(result)
        ctx.user = result;
        if(result.length > 0){
           await next();
        }else{
           ctx.body = {
             status:404,
             message:"请重新登陆"
           }
        }
    }else{
      ctx.body = {
        status:401,
        message:"未授权"
      }
    }
}else{
   await next()
}
})


// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(room.routes(),room.allowedMethods())

// error-handling 
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
