//모듈 호출
const express = require('express'), http = require('http');
const path = require('path');
const static = require('serve-static');

//현재는 사용 안합니다. logger.js에서 moment로 직접 붙힘
// const consoleStamp = require('console-stamp');

const https = require('https');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const rateLimit = require("express-rate-limit");
const favicon = require('serve-favicon');
const fs = require('fs');
const logger = require('./logger');


//SLL 인증서
const options = {
    key: fs.readFileSync(path.join(__dirname, 'private.key').toString()),
    cert: fs.readFileSync(path.join(__dirname,'certificate.crt').toString()),
    ca: fs.readFileSync(path.join(__dirname, 'ca_bundle.crt'))
};


app.set('port', 443);
app.use('/public',static(path.join(__dirname,'public')));
app.use('/upload/image', static(path.join(__dirname,'upload','image')));
app.use('/robot.txt',static(path.join(__dirname,'robot.txt')));

app.use('/', require('./router.js').router)
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true

}))

//아이콘
app.use(favicon(__dirname + '/public/image/favicon.ico'));

// Apply to all requests
const limiter = new rateLimit({
    windowMs: 60*1000,
    max: 30
})
app.use(limiter);


//타임스탬프 (logger.js에서 moment로 알아서 붙히므로 제외)
//consoleStamp(console, ['yyyy/mm/dd HH:MM:ss.l']);

console.log = function () {
    logger(console.log.arguments);
}


https.createServer(options, app).listen(process.env.SSL_PORT || 443, function (){
    console.log('---------------------------------')
    console.log(`Express https 서버를 시작한거에요! `);
    console.log(`port:[${app.get('port')}]`);
    console.log('---------------------------------\n')
});

//보조 http서버
http.createServer(options, app).listen(process.env.SSL_PORT ||3000, function (){
    console.log('---------------------------------')
    console.log(`Express http 보조 서버를 시작한거에요! `);
    console.log(`port:[${app.get('port')}]`);
    console.log('---------------------------------\n')
});


app.post('/login-test',function(req, res) {
    let paramId = req.body.id || req.query.id;
    let paramPassword = req.body.password || req.query.password;
    console.log(`[/Login][${req.ip}][POST][id:${paramId}][password:${paramPassword}]`);

    res.writeHead('200', {'Content-type':'text/html;charset=utf8'});
    res.write(`<p>당신의 아이디는 ${paramId}</p>`);
    res.write(`<p>당신의 비밀번호는 ${paramPassword}</p>`);
    res.end();
});

app.post('/location', function (req, res){
    let paramLocate = req.body.locations || req.query.locations;
    console.log('[/location][POST][%s][%s]', req.ip, paramLocate )
})
app.use('/',function(req, res) {
    let paramContent = req.body.loginContent;
    if(paramContent){
        if(paramContent.replace(/[^a-zA-Z ]/g, "") == ""){
            res.redirect('https://gurumnyang.kro.kr/imfor/error');
        } else {
            res.redirect('https://gurumnyang.kro.kr/imfor/'+paramContent.replace(/[^a-zA-Z ]/g, ""));
            console.log(`[/main][${req.ip}][POST]["${req.body.loginContent}"]`);
        }
    }
});

