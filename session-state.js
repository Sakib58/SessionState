const express=require('express');
const app=express();

const sqlite3 = require('sqlite3').verbose();
app.use(express.json());

let db = new sqlite3.Database("session-state.db", (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });

  function CreateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }

app.get('/cart/initialize',(req,res)=>{
    db.run('create table cart(session_id text,product text,count number)');
    res.send('Successful');
});



function updateCart(sid,item,res) {
    var isExists=false;
    items.forEach((element)=>{
        if(element.session_id==sid && element.product==item)isExists=true;
    });
    if(isExists){
        var smtp=db.prepare('update cart set count=(select count from cart where session_id=? and product=?)+1 where session_id=? and product=?');
        smtp.run(sid,item,sid,item);
        res.send('Updated! Your session_id: '+sid);
    }else{
        var smtp=db.prepare('insert into cart values(?,?,1)');
        smtp.run(sid,item);
        res.send('Inserted!  Your session_id: '+sid);
    }
}

var items=[];
function getAllItems() {
    items=[];
    db.each('select * from cart',(err,row)=>{
        items.push(
            {
            session_id:row.session_id,
            product:row.product,
            count:row.count,
            }
        );     
    });
}

app.get('/cart',(req,res)=>{
    var smtp=db.prepare('insert into cart values(?,?,1)');
    smtp.run(CreateGUID(),'book');
    res.send(items);
});

app.post('/cart/add/:item',(req,res)=>{
    var sid=undefined;
    var item=req.params.item;
    if(req.headers.session_id!==undefined){
        sid=req.headers.session_id;
    }
    else{
        sid=CreateGUID();
        //res.send('Success! Your session id: '+sid);
    }
    updateCart(sid,item,res);
    getAllItems();
});

app.delete('/cart/remove/:item',(req,res)=>{
    if(req.headers.session_id!==undefined){
        var sid=req.headers.session_id;
        var item=req.params.item;
        var isExists=false;
        items.forEach((element)=>{
            if(element.session_id==sid && element.product==item)isExists=true;
            });
        if(isExists){
            var smtp=db.prepare('delete from cart where session_id=? and product=?');
            smtp.run(sid,item);
            res.send(item+' is removed from your cart!');
        }else{
            res.send('You do not have this product in your cart!')
        }
    }
    else{
        res.send('You do not have any session! Add something on your cart first.');
    }
    getAllItems();
});

app.put('/cart/decrease/:item',(req,res)=>{
    if(req.headers.session_id!==undefined){
        var sid=req.headers.session_id;
        var item=req.params.item;
        var isExists=false;
        items.forEach((element)=>{
            if(element.session_id==sid && element.product==item)isExists=true;
            });
        if(isExists){
            var smtp=db.prepare('update cart set count=(select count from cart where session_id=? and product=?)-1 where session_id=? and product=?');
            smtp.run(sid,item,sid,item);
            res.send(item+' is decreased by 1 from your cart!');
        }else{
            res.send('You do not have this product in your cart!')
        }
    }
    else{
        res.send('You do not have any session! Add something on your cart first.');
    }
    getAllItems();
});


const port=process.env.PORT || 3000;
app.listen(port,()=>console.log('Listening on port: ',port));