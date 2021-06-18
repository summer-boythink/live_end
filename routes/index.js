const router = require('koa-router')()
const {execsql} = require('../utils/index')

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get("/Allsort",async(ctx,next) => {
  let res = await execsql(`select * from sort`)
  ctx.body = {
    status:200,
    data:res
  }
})  

router.get("/getOneSort",async(ctx,next) => {
  let {id} = ctx.query;
  console.log(ctx.query);
  let res = await execsql(`select * from room where sort=${id}`)
  console.log(res);
  ctx.body = {
    status:200,
    data:res 
  }
}) 
 
module.exports = router