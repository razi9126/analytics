/*
*
* Copyright 2015 gRPC authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
*/

var PROTO_PATH = './Analytics_Recommender.proto';

var fs = require('fs');
var parseArgs = require('minimist');
var path = require('path');
var _ = require('lodash');
var grpc = require('grpc');
var paitoo = grpc.load(PROTO_PATH).paitoo;


// Connecting to sql database____________________________________________
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
// ___________________________________________________________________


function GetUploadedReviews(call) {
    con.query("SELECT * FROM Uploaded_Review", function (err, result, fields) {
            if (err) throw err;
            for (i in result) {
                // console.log(result)
                var data = JSON.parse(JSON.stringify(result[i]));
                var st = {}
                st.uploader_id = data.user_id;
                st.review_id = data.review_id;
                st.restaurant_id = data.rest_id;
                st.service = data.service;
                st.ambience = data.ambience;
                st.cleanliness = data.clean;
                st.dish_name = data.dish;
                if(data.value==1)
                    {st.value_for_money = true;}
                else
                    {st.value_for_money = false;}
                st.taste = data.taste;

                call.write(st);
                }; 
            call.end();  
          });
}

function GetLikedReviews(call) {
    con.query("SELECT * FROM Review_Liked", function (err, result, fields) {
            if (err) throw err;

            for (i in result) {
                // console.log(result)
                var data = JSON.parse(JSON.stringify(result[i]));
                var st = {}
                var obj = {}
                st.uploader_id = data.uploader_id;
                st.review_id = data.review_id;
                st.restaurant_id = data.rest_id;
                st.service = data.service;
                st.ambience = data.ambience;
                st.cleanliness = data.clean;
                st.dish_name = data.dish;
                if(data.value==1)
                    {st.value_for_money = true;}
                else
                    {st.value_for_money = false;}
                st.taste = data.taste;


                obj.review = st;
                obj.user_id = data.user_id

                
                call.write(obj);
                }; 
            call.end();  
          });
}

function GetFollowedRestaurants(call) {
    con.query("SELECT * FROM Followed_Restaurant", function (err, result, fields) {
            if (err) throw err;
            for (i in result) {
                // console.log(result)
                var data = JSON.parse(JSON.stringify(result[i]));
                var st = {}
                st.user_id = data.user_id;
                st.restaurant_id = data.rest_id;
                call.write(st);
                }; 
            call.end();  
          });
}

function GetOpenedDish(call) {
    call.end()
}
/**
* Get a new server with the handler functions in this file bound to the methods
* it serves.
* @return {Server} The new server object
*/
function getServer() {
    var server = new grpc.Server();
    server.addProtoService(paitoo.Analytics.service, {
        GetUploadedReviews: GetUploadedReviews,
        GetLikedReviews: GetLikedReviews,
        GetFollowedRestaurants: GetFollowedRestaurants,
        GetOpenedDish: GetOpenedDish
    });
    return server;
}

if (require.main === module) {
// If this is run as a script, start a server on an unused port
    var routeServer = getServer();
    routeServer.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    routeServer.start();
}

exports.getServer = getServer;
