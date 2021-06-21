const router = require('koa-router')()
const {execsql, exec} = require('../utils/index')
const {tomd5} = require('../utils/index')
const request = require('request');

const alipaySdk = require('../utils/alipay')
const AlipayFormData = require('alipay-sdk/lib/form').default;

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

router.post('/changePass',async(ctx,next) => {
  console.log(ctx.request.body);
  let {oldPassword,newPassword} = ctx.request.body;
  oldPassword = tomd5(oldPassword);
  newPassword = tomd5(newPassword);
  let res = await execsql(`select * from user where password='${oldPassword}'and user='${ctx.user}'`);
  if(res.length === 0){
    return ctx.body = { 
      status:400,
      msg:"旧密码错误"
    }
  }else{
    let res = await execsql(`update user set password='${newPassword}' where user='${ctx.user}'`);
    if(res.affectedRows > 0){
      return ctx.body = {
        status:200,
        msg:"修改成功"
      }
    }
  }
})

router.get('/getSecret',async(ctx,next) => {
  let res = await execsql(`select * from room where id=(SELECT room_id from user WHERE user='${ctx.user}')`)
  let id = res[0].id;
  let data = await exec(async (res,rej) => {
    request(`http://81.68.72.195:8090/control/get?room=${id}`,async(error, response, data) => {
      console.log(data);
      res(JSON.parse(data))
  })
})
  ctx.body = {
    status:200,
    data:data
  } 
}) 
  
router.post('/alipay',async(ctx,next) => {
    let {orderId} = ctx.request.body;

    const formData = new AlipayFormData();
    formData.setMethod('get');

    formData.addField('returnUrl', 'http://www.tangqihang.top');
    formData.addField('bizContent', {
    outTradeNo: orderId,
    productCode: 'FAST_INSTANT_TRADE_PAY',
    totalAmount: '0.01',
    subject: '商品',
    body: '商品详情'
    });

    const result = await alipaySdk.exec(
    'alipay.trade.page.pay',
    {},
    { formData: formData },
    );

    // result 为可以跳转到支付链接的 url
    console.log(result);
    
        // res.send({
        //     success:"true",
        //     code:200,
        //     result:resp
        // })
      ctx.body = {
            success:"true",
            code:200,
            result:result
      }
})

router.post('/queryOrder',async(ctx,next) => {
  let {out_trade_no,trade_no} = ctx.request.body;
  const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('bizContent', {
        out_trade_no, 
        trade_no
    });

    const result = await alipaySdk.exec(
    'alipay.trade.query',
    {},
    { formData: formData },
    );

    console.log(result);
})

// router.get('/getSecret',async(ctx,next) => { 

// })

module.exports = router 