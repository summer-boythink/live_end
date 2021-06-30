const router = require('koa-router')()
const {execsql,isFormData,exec} = require('../utils/index')
const cos = require('../utils/cos')
const formidable = require('formidable')
const fs = require('fs');
const redis = require('../db/redis_init');
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
 
router.get('/isFollow',async(ctx,next) => {
    let {RoomId} = ctx.query;
    //查看redis里面是否有这个人关注列表
    let data =await exec((res,rej) => {
        redis.smembers(`${ctx.user}`,(err,data) => {
            console.log(data);
            if(data === undefined){
                res([])
            }else{ 
                res(data)
            }
        })
    })
    if(data.length === 0){
        ctx.body = {
            status:200,
            isFollow:false
        }
    }else{
        ctx.body = {
            status:200,
            isFollow:data.indexOf(RoomId) !== -1
        } 
    } 
})
 
router.get('/toFollow',async(ctx,next) => {
    let {RoomId} = ctx.query;
    await exec((res,rej) => {
        redis.sadd(ctx.user,RoomId,() => {
            res()
        })
    })
    await execsql(`update room set followers=followers+1 where id='${RoomId}'`)
    ctx.body = {
        status:200,
        msg:"关注成功"
    }
})

router.get('/cancelFollow',async(ctx,next) => {
    let {RoomId} = ctx.query;
    await exec((res,rej) => {
        redis.srem(ctx.user,RoomId,() => {
            res()
        })
    })
    await execsql(`update room set followers=followers-1 where id='${RoomId}'`)
    ctx.body = {
        status:200,
        msg:"取消关注成功"
    }
}) 

router.get('/getAllGift',async(ctx,next) => {
    let result = await execsql(`select * from gift`)
    // console.log(result[0]);
    ctx.body = {
        status:200,
        result 
    }
}) 

router.get('/getRoomUser',async(ctx,next) => {
    let {RoomId} = ctx.query;
    let result = await execsql(`select user,avatar from user where room_id='${RoomId}'`)
    ctx.body = {
        status:200,
        user:result[0].user,
        url:result[0].avatar
    }
})

module.exports = router