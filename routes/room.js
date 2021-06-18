const router = require('koa-router')()
const {execsql,isFormData} = require('../utils/index')
const cos = require('../utils/cos')
const formidable = require('formidable')
const fs = require('fs');
router.prefix('/room')


router.get('/getmyroom',async (ctx,next) => {
   let res =  await execsql(`SELECT * from room where id=(SELECT room_id from user WHERE user='${ctx.user}')`)
   ctx.body = {
       status:200,
       data:res
   }
})

router.post('/changeImg',async (ctx,next) => {
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

//   2 处理
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
            await execsql(`update room set img_url='http://imgs-1304695318.cos.ap-shanghai.myqcloud.com/${times}.${suffix}' where 
            id=(SELECT room_id from user WHERE user='${ctx.user}')`)
           
    })  
    ctx.body = {
        status:200,
        name:"上传完成!",
    }
})

router.get("/getImg",async (ctx,next) => {
    let res = await execsql(`select img_url from room where id=(SELECT room_id from user WHERE user='${ctx.user}')`)
    console.log(res[0]);
    ctx.body = {
        status:200,
        img_url:res[0].img_url
    }
})

router.post('/setRoom',async(ctx,next) => {
    let {name,sort} = ctx.request.body;
    await execsql(`update room set name='${name}',sort='${sort}' where id=(SELECT room_id from user WHERE user='${ctx.user}')`)
    ctx.body = {
        status:200,
        msg:"直播间修改成功"
    }
})

module.exports = router 