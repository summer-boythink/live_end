const router = require('koa-router')()
const {execsql, exec,isFormData} = require('../utils/index')
const {tomd5} = require('../utils/index')
const request = require('request');
const formidable = require('formidable')
const alipaySdk = require('../utils/alipay')
const AlipayFormData = require('alipay-sdk/lib/form').default;
const fs = require('fs');
const cos = require('../utils/cos')


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
      console.log(JSON.parse(data));
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

    formData.addField('returnUrl', 'http://localhost:8080/#/checkpay');
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
    await exec(async (res,rej) => { 
      request(result,async(error,response,data) => {
        console.log(data);
        res(JSON.parse(data))
      })
    })
    return ctx.body = {
      status:200
    }
})

router.get('/searchRoom',async(ctx,next) => {
  let {name} = ctx.query;
  console.log(ctx.query);
  let res = await execsql(`SELECT * FROM room where name LIKE '%${name}%'`)
  console.log(res);
  ctx.body = {
    status:200,
    data:res  
  } 
})

router.get('/getMyName',async(ctx,next) => {
  // let res = await execsql(`SELECT name FROM room where id=(SELECT room_id from user WHERE user='${ctx.user}')`)
  ctx.body = {
    status:200,
    name:ctx.user
  }
})

router.get('/getRoomName',async(ctx,next) => {
    let {RoomId} = ctx.query;
    let res = await execsql(`SELECT name FROM room where id='${RoomId}'`)
    ctx.body = {
      status:200,
      RoomName:res[0].name
    }
})

router.get('/getAvatar',async(ctx,next) => {
  let res = await execsql(`select avatar from user where user='${ctx.user}'`)
  ctx.body = {
    status:200,
    avatar:res[0].avatar
  }
})

router.post('/setAvatar',async(ctx,next) => {
  // let {avatar} = ctx.request.body;
  
    let times;
    let suffix;

    // 1 判断 
    if (!isFormData(ctx.req)){
        ctx.body = {
            status:400,
            message:"错误的请求, 请用multipart/form-data格式"
        }
        return
    }
    let data = exec((response,reject) => {
      var form = new formidable.IncomingForm()
      form.uploadDir = './myImage'
      form.keepExtensions = true

      form.on('field', (field, value) => {
          console.log(field+1)
          console.log(value+2)
      })

    
      form.on('file', (name, file) => {
          // 重命名文件
          let types = file.name.split('.')
          suffix = types[types.length - 1]
          times = new Date().getTime()
          fs.renameSync(file.path,'./myImage/' + times + '.' + suffix)
          cos.putObject({
                  Bucket:'imgs-1304695318',
                  Region:'ap-shanghai',
                  Key:`${times}.${suffix}`,
                  StorageClass:'STANDARD',
                  Body:fs.createReadStream('./myImage/' + times + '.' + suffix),
                  onProgress: function(progressData) { 
                      // console.log(JSON.stringify(progressData));
                  }
              }, function(err, data) {
                  console.log(err || data);
                  if(data.statusCode === 200){
                    fs.unlinkSync(`./myImage/${times}.${suffix}`)
              }
          })
          //对象存储
      })
      form.parse(ctx.req)
      form.on('end', async () => {
              await execsql(`update user set avatar='http://imgs-1304695318.cos.ap-shanghai.myqcloud.com/${times}.${suffix}' where 
              user='${ctx.user}'`)
              let res = await execsql(`select avatar from user where user='${ctx.user}'`)
              response(res[0].avatar)
      })
  })
    ctx.body = {
        status:200,
        avatar:data
    }
})

// router.get('/getSecret',async(ctx,next) => {  

// })
 
module.exports = router 