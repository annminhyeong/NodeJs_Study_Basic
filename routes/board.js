const router = require('express').Router();

function checkLogin(request, response, next){
    if(request.user){
        next();
    }else{
        response.send('로그인 안함');
    }
}

router.use('/sprot', checkLogin);

router.get('/sport', function(request, response){
    response.send('스포츠 게시판');
});

router.get('/game', function(request, response){
    response.send('게임 게시판');
});

module.exports = router;