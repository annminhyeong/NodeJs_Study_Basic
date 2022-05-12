const router = require('express').Router();

router.get('/shirts', function(request, response){
    response.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(request, response){
    response.send('바지 파는 페이지입니다.');
}); 

module.exports = router;