const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

const MongoClient = require('mongodb').MongoClient;
const MongoURl = 'mongodb+srv://admin:1234@cluster0.37ayx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

app.set('view engine', 'ejs');

let db;
MongoClient.connect(MongoURl, function(error, client){

    if(error){
        return console.log(error);
    }

    db = client.db('todoapp');
    // db.collection('post').insertOne({_id:100, title:'test1', content:'test2'},function(err, res){
    //     console.log('저장완료');
    // });

    app.listen(8080, function(){
        console.log('listening on 8080');
    });
});

app.get('/beauty', function(res, resp){
    resp.send('뷰티용품 사세요');
});

app.get('/',function(res, resp){
    resp.sendFile(__dirname + '/index.html');
});

app.get('/write',function(res, resp){
    resp.sendFile(__dirname + '/write.html');
});

app.post('/add', function(res, resp){
    resp.send('전송완료');
    
    db.collection('counter').findOne({name : '게시물개수'}, function(err, result){
        console.log(result.totalPost);
        let count = result.totalPost;

        db.collection('post').insertOne({_id : count+1, title : res.body.title , content : res.body.content},
            function(err, res){
                db.collection('counter').updateOne({name : '게시물개수'},{$inc :{totalPost : 1}},function(err, result){
                    if(err){
                        return console.log(err);
                    }
                });
            });
    });
});

app.get('/list',function(res, resp){
    db.collection('post').find().toArray(function(err, result){
        console.log(result);
        resp.render('list.ejs', {posts : result});
    });

});

