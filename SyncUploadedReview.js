const request = require('request');
var cd=[];
// _______________________________________________________________
const mysql = require('mysql');
const corsMiddleware = require('restify-cors-middleware');
const cors = corsMiddleware({
	origin:['*'],
});
// const fs = require('fs')


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
// _______________________________________________________________

request('https://api.paitoo.com.pk/reviews/all', { json: true }, (err, res, body) => {
	if (err) { return console.log(err); }
  // console.log(res.body);
  for (i in res.body) {
  	var data = JSON.parse(JSON.stringify(res.body[i]));
  	var st = {}
  	st.review_id = data._key;
  	st.user_id = data.user._id;
  	st.rest_id = data.selectedRestaurant._id;
  	st.dish=[]
  	for (j in data.dishes) {
  		var one={}
  		var dish = JSON.parse(JSON.stringify(data.dishes[j]));
  		one.dishname=dish.name
  		one.taste = dish.taste
  		if (dish.valueForMoney=='yes')
  			one.value=true
  		else
  			one.value=false
  		st.dish.push(one);
  	}
  	st.ambience = data.restaurantRatingValues[0].value
  	st.service = data.restaurantRatingValues[1].value
  	st.clean = data.restaurantRatingValues[2].value
		  // console.log(st);
		  cd.push(st);
	}

		var sql = "CREATE TABLE Uploaded_Review (review_id VARCHAR(48), user_id VARCHAR(48), rest_id VARCHAR(48), service INTEGER, ambience INTEGER, clean INTEGER, dish VARCHAR(500), value BOOLEAN, taste INTEGER, PRIMARY KEY (review_id, dish) )";
		con.query(sql, function (err, result) {
			if (err.code!='ER_TABLE_EXISTS_ERROR') throw err;
			console.log("Table created Uploaded_Review");
			for (k in cd) {
				var ta = cd[k]
				var alldishes= ta.dish;
				for (l in alldishes) {
					var acdish= alldishes[l].dishname
					var actaste = alldishes[l].taste
					var acval = alldishes[l].value

					var sq = `INSERT INTO Uploaded_Review (review_id, user_id, rest_id, service, ambience, clean, dish, value, taste) VALUES ( "${ta.review_id}", "${ta.user_id}", "${ta.rest_id}","${ta.service}","${ta.ambience}","${ta.clean}", "${acdish}",${acval},"${actaste}")`;
					con.query(sq, function (err, result) {
						if (err) throw err;
						console.log("INSERTED in uploaded_review");

					});
				}

			}
		});
	})

