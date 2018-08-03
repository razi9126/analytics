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

var PROTO_PATH = './../Analytics_Recommender.proto';

var fs = require('fs');
var parseArgs = require('minimist');
var path = require('path');
var _ = require('lodash');
var grpc = require('grpc');
var paitoo = grpc.load(PROTO_PATH).paitoo;

function GetUploadedReviews(call) {
    call.end()
}

function GetLikedReviews(call) {
    call.end()
}

function GetFollowedRestaurants(call) {
    users_rests = []
    for (i = 1; i < 20; i++){
        x = i+i;
        y = i*i;
        obj = {user_id: x.toString(), restaurant_id: y.toString()}
        users_rests.push(obj)
    };
    _.each(users_rests, function(feature) {
        call.write(feature);
    });
    call.end();
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
