const mysql = require('mysql');
const corsMiddleware = require('restify-cors-middleware');
const cors = corsMiddleware({
    origin:['*'],
});
const fs = require('fs')
// var server = require('http').createServer();

// server.pre(cors.preflight);
// server.use(cors.actual);
// server.use(restify.plugins.bodyParser({
// }));
// server.use(restify.plugins.queryParser());
const readFile = f => new Promise((resolve,reject) =>
    fs.readFile(f, (e, d) => e? reject(e):resolve(d)))


const server = require('http').createServer(async (req,resp) =>
    resp.end( await readFile(req.url.substr(1))))
var io = require('socket.io')(server);

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "qwerty0000",
  database: "analytics"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to DB!");
  });

io.on('connection', function(client){
    console.log("Client id is : "+ client.id);
    io.sockets.emit('start')

    client.on('event', function(data){
        handleMessage(data);
    });
    client.on('disconnect', function(){




    });
});
server.listen(3000);

async function handleMessage(data){
  switch(data.event){
    case "FOLLOWED_RESTAURANT":
        var sql = `INSERT INTO Followed_Restaurant (user_id, rest_id) VALUES ("${data.user_id}", "${data.rest_id}")`;
        // console.log(sql);
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted in Followed_Restaurant table");
        });
        break;
    case "REVIEW_UPLOADED":
        // console.log("HEERE");
        var sql = `INSERT INTO Uploaded_Review (user_id, review_id, dishname, rest_id, service, ambience, clean, taste, value) VALUES ("${data.user_id}", "${data.review_id}","${data.dishname}","${data.rest_id}","${data.service}","${data.ambience}","${data.clean}","${data.taste}",${data.value})`;
        console.log(sql)
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted in Uploaded_Review table");
        });
        break;
    case "LIKED_REVIEW":
        var sql = `INSERT INTO Review_Liked (user_id, uploader_id,review_id, dishname, rest_id, service, ambience, clean, taste, value) VALUES ("${data.user_id}","${data.uploader_id}", "${data.review_id}","${data.dishname}","${data.rest_id}","${data.service}","${data.ambience}","${data.clean}","${data.taste}",${data.value})`;
        console.log(sql)
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted in Review_Liked table");
        });
        break;
    case "DISH_OPENED":
        var sql = `INSERT INTO Opened_Dish (user_id, rest_id, dishname, category, fromsearch, fromfeed) VALUES ("${data.user_id}","${data.rest_id}", "${data.dishname}","${data.category}",${data.fromsearch},${data.fromfeed})`;
        console.log(sql)
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted in Opened_Dish table");
        });
        break;
  }
}
