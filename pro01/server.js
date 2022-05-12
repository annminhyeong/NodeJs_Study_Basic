const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

const MongoClient = require('mongodb').MongoClient;


app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const dotenv = require('dotenv').config();


let db;
MongoClient.connect(process.env.MongoURl, function(error, client){

    if(error){
        return console.log(error);
    }

    db = client.db('todoapp');
    // db.collection('post').insertOne({_id:100, title:'test1', content:'test2'},function(error, result){
    //     console.log('저장완료');
    // });

    app.listen(process.env.PORT, function(){
        console.log('listening on 8080');
    });
});

app.get('/beauty', function(request, response){
    response.send('뷰티용품 사세요');
});

app.get('/',function(request, response){
    // response.sendFile(__dirname + '/index.ejs');
    response.render('index.ejs');
});

app.get('/write',function(request, response){
    response.render('write.ejs')
});

app.get('/list',function(request, response){
    db.collection('post').find().toArray(function(error, result){
        console.log(result);
        response.render('list.ejs', {posts : result});
    });
});

app.get('/search', function(request, response){
    console.log(request.query.value);
    let 검색조건 = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: request.query.value,
                    path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                }
            }
        }
    ]; 
    db.collection('post').aggregate(검색조건).toArray(function(error, result){
        response.render('search.ejs', {posts : result})
    });
});

app.get('/detail/:id',function(request,response){
    db.collection('post').findOne({_id : parseInt(request.params.id)}, function(error, result){
        console.log(result);
        response.render('detail.ejs', { data : result});
    })
});

app.get('/edit/:id', function(request, response){
    db.collection('post').findOne({_id : parseInt(request.params.id)}, function(error, result){
        console.log(result);
        response.render('edit.ejs', {data : result});
    });
});

app.put('/edit',function(request, response){
    db.collection('post').updateOne({_id : parseInt(request.body.id)},
    { $set :{title : request.body.title, content : request.body.content}}, function(error, result){
            console.log('수정완료');
            response.redirect('/list');
        }
    );
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const req = require('express/lib/request');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(request, response){
    response.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}),
    function(request, response){
        response.redirect('/');
});

app.get('/mypage', checkLogin, function(request, response){
    console.log(request.user);
    response.render('mypage.ejs', {user : request.user});
});

function checkLogin(request, response, next){
    if(request.user){
        next();
    }else{
        response.send('로그인 안함');
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false
}, function(입력한아이디, 입력한비번, done){
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({id : 입력한아이디}, function(error, result){
        console.log(result);
        if(error){
            return done(error);
        }
        if(!result){
            //done(서버에러, 결과, 에러메세지);
            return done(null, false, {message : '존재하지않는 아이디입니다.'});
        }

        if(입력한비번 == result.pw){
            return done(null, result);
        }else{
            return done(null, false, {message : '비밀번호가 틀렸습니다.'});
        }
    });
}));

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(아이디, done){
    db.collection('login').findOne({id : 아이디}, function(error, result){
        done(null, result);
    });
});

app.post('/register', function(request, response){
    db.collection('login').insertOne({id : request.body.id, pw : request.body.pw}, function(error, result){
        response.redirect('/');
    });
});

app.post('/add', function(request, response){
    response.send('전송완료');
    
    db.collection('counter').findOne({name : '게시물개수'}, function(error, result){
        console.log(result.totalPost);
        let count = result.totalPost;
        let insertData = {_id : count+1, title : request.body.title , content : request.body.content, writer : request.user._id};
        db.collection('post').insertOne( insertData,
            function(error, result){
                db.collection('counter').updateOne({name : '게시물개수'},{$inc :{totalPost : 1}},function(error, result){
                    if(error){
                        return console.log(error);
                    }
                });
            });
    });
});

app.delete('/delete', function(request, response){
    console.log(request.body);
    request.body._id = parseInt(request.body._id);
    let deleteData = { _id : request.body._id, writer : request.user._id};
    db.collection('post').deleteOne( deleteData , function(error, result){
        error ? console.log(error) : console.log('삭제완료');
        response.status(200).send({message : '성공했습니다.'});
    });
});
app.use('/shop', require('./routes/shop'));
app.use('/board/sub', require('./routes/board'));

const multer = require('multer');
const storage =multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/image');
    },
    filename : function(req, file, cb){
        cb(null, file.originalname);
    }
});

const upload = multer({storage : storage});

app.get('/upload', function(request, response){
    response.render('upload.ejs');
});

app.post('/upload', upload.single('img') , function(request, response){
    response.send('완료');
});

app.get('/image/:imageName', function(request, response){
    response.sendFile(__dirname + '/public/image/' + request.params.imageName);
});