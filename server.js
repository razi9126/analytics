var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "qwerty0000",
  database: "pets"
});

con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT name, owner FROM cats", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    // console.log("dsejfi");
    // console.log(fields);
  });
});

var operation = retry.operation({
    forver: true,
});
const cors = corsMiddleware({
    origin:['*'],
});
server.pre(cors.preflight);
server.use(cors.actual);
producer.on('ready',()=>{
    console.log('producer is ready');
})

producer.on('error',(err)=>{
    console.log('producer has an error',err);
})
client.on('ready',function(){
    console.log('client is ready');
});
client.on('error',function(error){
    console.log('client has an error',error);
})
server.use(restify.plugins.bodyParser({
}));
server.use(restify.plugins.queryParser());
addTopics();
function addTopics(){
    restaurantConsumer.addTopics(['newReview','deleteReview'],function(err,added){
        if(err){
            console.log('error adding topics');
            producer.createTopics(err.topics,false,function(err,data){
                if(err){
                    console.log('err',err);
                }else{
                    console.log('data',data);
                    addTopics();
                }
            });
        }
    });
}
restaurantConsumer.on('message',async function(message){
    data=JSON.parse(message.value);
    switch(message.topic){
        case "newReview":
            updateRestaurantScore(data);
            break;
        case "deleteReview":
            deleteReview(data);
            break;
    }
})
function updateRestaurantScore(story){
   operation.attempt(function(currentAttempt){
       restaurantProvider.updateScore(story,function(err){
           if(err){
               console.log(err);
               operation.retry(err);
           } else
               console.log('score updated');
       });
   });
}
function deleteReview(story){
    operation.attempt(function(currentAttempt){
        restaurantProvider.deleteReview(story,function(err){
            if(err){
                console.log(err);
                operation.retry(err);
            }else
                console.log('review removed from stats');
        });
    });
}
function upload(file){
    return new Promise(function(resolve,reject){
       try {
           var name = PATTERN.exec(file);
           s3.upload({
               ACL:'public-read',
               Body:fs.createReadStream(file),
               Key:name[0],
               Bucket:'paitoo-restaurants',
           },function(err,data){
               if (err)
                   reject(err);
               else {
                   resolve({
                       mediaLink:'https://paitoo-restaurants.s3.ap-south-1.amazonaws.com/'+name[0],
                       bucket:'paitoo-restaurants',
                       name:name[0]
                   });
               }
           });
       }catch(err){
           reject(err);
       }
    })
}
function uploadImages(files){
   return new Promise(function(resolve,reject){
       var uploads=files.map(upload);
       var urls=Promise.all(uploads);
       urls.then((data)=>{
           resolve(data);
       });
   });
}
function deleteRestaurantMessage(restaurant){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'deleteRestaurant',messages:JSON.stringify(restaurant)}],function(err,data){
            if(err){
                console.log('err delete',err);
                operation.retry(err);
            }else{
                console.log('data delete',data);
            }
        });
    });
}
function deleteMenuItemMessage(item){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'deleteMenuCategory',messages:JSON.stringify(item)}],function(err,data){
            if(err){
                console.log('err delete menu item',err);
                operation.retry(err);
            } else
                console.log('data delete menu item',data);
        });
    });
}
function newMenuItemMessage(item){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'addMenuCategory',messages:JSON.stringify(item)}],function(err,data){
            if(err){
                console.log('err new menu item',err);
                operation.retry(err);
            }else
                console.log('data new menu item',data);
        });
    });
}
function editRestaurantCityMessage(restaurant){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'editRestaurantCity',messages:JSON.stringify(restaurant)}],function(err,data){
            if(err){
                console.log('err',err);
                operation.retry(err);
            } else {
                console.log('data',data);
            }
        });
    });
}
function editRestaurantCusineMessage(restaurant){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'editRestaurantCusine',messages:JSON.stringify(restaurant)}],function(err,data){
            if(err){
                console.log('err',err);
                operation.retry(err);
            } else {
                console.log('data',data);
            }
        });
    });
}
function newRestaurantMessage(restaurant){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'newRestaurant',messages:JSON.stringify(restaurant)}],function(err,data){
            if(err){
                console.log('err',err);
                operation.retry(err);
            }else
                console.log('data',data);
        });
    });
}
async function create_new_restaurant(req,res,next){
    console.log(req.params);
   var files=[];
   if(req.files){
        var filekeys=Object.keys(req.files);
   } else {
       var filekeys=[];
   }
   filekeys.forEach(function(key){
       files.push(req.files[key].path);
   });
   urls=await uploadImages(files);
   req.params.images=urls;
   restaurantProvider.save(req.params,function(error,docs){
       if(error){
           console.log(error)
       } else{
           res.header('Access-Control-Allow-Origin',"*");
           res.header('Access-Control-Allow-Methods',"POST,GET");
           res.header('Access-Control-Allow-Headers',"*");
           res.send(200);
           newRestaurantMessage({id:docs._id,cusine:docs.cusine,city:docs.city});
           next();
       }
   });
}


function get_all_restaurants(req,res,next){
    restaurantProvider.findAll(function(error,restaurants){
        if (error) {
            console.log(error);
            res.send(error,500);
            next();
        }
        res.header('Access-Control-Allow-Origin',"*");
        res.header('Access-Control-Allow-Methods',"POST,GET");
        res.header('Access-Control-Allow-Headers',"*");
        res.json(restaurants);
        next();
    });
}

function health(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods',"POST,GET");
    res.header('Access-Control-Allow-Headers',"*");
    //console.log('got a health request');
    res.send('The Service is working');
    producer.send([{topic:'test2',messages:JSON.stringify({"name":'hello'})}],function(err,data){
        if(err)
            console.log('err',err);
        else
            console.log('data',data);
    });
};

function deletePhoto(req,res,next){
    restaurantProvider.deletePhoto(req.params,function(){
        s3.deleteObject({Bucket:req.params.bucket,Key:req.params.name},function(err,data){
            if(err)
                res.send(400);
            else {
                console.log('deleted');
                res.header('Access-Control-Allow-Origin',"*");
                res.header('Access-Control-Allow-Methods',"POST,GET");
                res.header('Access-Control-Allow-Headers',"*");
                res.send(200);
            }
        });
    });
}

async function editRestaurant(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods',"POST,GET");
    res.header('Access-Control-Allow-Headers',"*");
    var files=[];
    if(req.files){
        var filekeys=Object.keys(req.files);
        console.log(filekeys);
    } else {
       var filekeys=[];
    }
    filekeys.forEach(function(key){
       console.log(key);
       files.push(req.files[key].path);
    });
    if(files.length > 0){
        urls=await uploadImages(files);
        req.params.images=urls;
    }
    restaurantProvider.editRestaurant(req.params,function(restaurant,cusineChanged,cityChanged){
        res.send(200);
        if(cusineChanged)
            editRestaurantCusineMessage({id:restaurant._id,cusine:restaurant.cusine});
        if(cityChanged)
            editRestaurantCityMessage({id:restaurant._id,city:restaurant.city});
        next();
    });
}
function getRestaurant(req,res,next){
    restaurantProvider.getRestaurant(req.params,function(restaurant){
        res.header('Access-Control-Allow-Origin',"*");
        res.header('Access-Control-Allow-Methods',"POST,GET");
        res.header('Access-Control-Allow-Headers',"*");
        res.send(200,restaurant);
        next();
    });
}
function createCategoryMessage(data){
    var message=JSON.stringify({id:data.id,category:data.newCategory});
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'createCategory',messages:message}],function(err,data){
            if(err){
                console.log('error sending create category message',err);
                operation.retry(err);
            }else
                console.log('message sent');
        });
    });
}
function deleteCategoryMessage(data){
    operation.attempt(function(currentAttempt){
        var message=JSON.stringify({id:data.id,category:data.originalCategory});
        producer.send([{topic:'deleteCategory',messages:message}],function(err,data){
            if(err){
                console.log('error sending delete category message',err);
                operation.retry(err);
            }else
                console.log('message sent');
        });
    });
}


function editCategoryMessage(data){
    setTimeout(()=>{
        operation.attempt(function(currentAttempt){
            producer.send([{topic:'editCategory',messages:JSON.stringify(data)}],function(err,data){
                if(err){
                    console.log('error sending edit category message',JSON.stringify(data),JSON.stringify(err));
                    operation.retry(err);
                }else
                    console.log('edit category message sent',JSON.stringify(data));
            });
        })},60000
    );
}


function editItem(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods',"POST,GET");
    res.header('Access-Control-Allow-Headers',"*");
    if(req.params.originalName === req.params.newName && req.params.originalCategory !== req.params.newCategory){
        message = Object.assign({},req.params);
        delete message.newName;
        message.dishName = message.originalName;
        delete message.originalName;
        editCategoryMessage(message);
    }
    restaurantProvider.editItem(req.params,function(err,deleteCategory,createCategory){
        if(err){
            console.log(err);
            res.send(400,err);
            return next();
        }else
            res.send(200);
        if(createCategory){
            var data={
                id:req.params.id,
                category:req.params.newCategory,
            }
            newMenuItemMessage(data);
        }
        if(deleteCategory){
            var data={
                id:req.params.id,
                category:req.params.originalCategory,
            }
            deleteMenuItemMessage(data);
        }
    });
}
function addMenuItem(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods',"POST,GET");
    res.header('Access-Control-Allow-Headers',"*");
    restaurantProvider.addMenuItem(req.params,function(){
        res.send(200);
        newMenuItemMessage(req.params);
        if(req.params.category === "UR" || req.params.shouldClassify){
            dish = {
                id:req.params.id,
                name:req.params.name,
                category:req.params.category,
            }
            axios.post('http://classification-api/classify',dish).then(response=>{console.log(response.status)}).catch(err=>{console.log(err)});
        }
        next();
    });
}

function deleteMenuItem(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods',"POST,GET");
    res.header('Access-Control-Allow-Headers',"*");
    restaurantProvider.deleteMenuItem(req.params,function(onlyItem){
        res.send(200);
        if(onlyItem)
            deleteMenuItemMessage(req.params);
        next();
    });
}

function deleteRestaurant(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods',"POST,GET");
    res.header('Access-Control-Allow-Headers',"*");
    console.log('delete restaurant request');
    restaurantProvider.deleteRestaurant(req.params,function(restaurant){
        if(restaurant.images){
            restaurant.images.map(image=>{
                s3.deleteObject({Bucket:image.bucket,Key:image.name},function(err,data){
                    if(err)
                        console.log(err);
                    else
                        console.log(data);
                });
                res.send(200);
                deleteRestaurantMessage(req.params);
            });
        }
    });
}
function unfollowRestaurantMessage(message){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'unfollowRestaurant',messages:JSON.stringify(message)}],function(err,data){
            if(err){
                operation.retry(err);
                console.log(err);
            }else
                console.log(data);
        });
    });
}
function followRestaurantMessage(message){
    operation.attempt(function(currentAttempt){
        producer.send([{topic:'followRestaurant',messages:JSON.stringify(message)}],function(err,data){
            if(err){
                console.log(err);
                operation.retry(err);
            }else
                console.log(data);
        });
    });
}
function followRestaurant(req,res,next){
    restaurantProvider.followRestaurant(req.params,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}
function unfollowRestaurant(req,res,next){
    restaurantProvider.unfollowRestaurant(req.params,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}
function getRestaurantByName(req,res,next){
    restaurantProvider.getRestaurantByName(req.query,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}
function bookmarkRestaurant(req,res,next){
    restaurantProvider.bookmarkRestaurant(req.params,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}
function unbookmarkRestaurant(req,res,next){
    restaurantProvider.unbookmarkRestaurant(req.params,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}//need a post route to create a restaurant
//need a put request to update a restaurant
function getCategories(req,res,next){
    restaurantProvider.getCategories(function(err,result){
        res.header('Access-Control-Allow-Origin',"*");
        res.header('Access-Control-Allow-Methods',"POST,GET");
        res.header('Access-Control-Allow-Headers',"*");
        if(err){
            console.log(err);
            res.send(400,err);
        } else
            res.send(200,result);
    });
}
function dishSearch(req,res,next){
    restaurantProvider.dishSearch(req.query,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}
function categorySearch(req,res,next){
    restaurantProvider.categorySearch(req.query,function(err,result){
        if(err)
            res.send(400,err);
        else
            res.send(200,result);
    });
}
function migrate(req,res,next){
    restaurantProvider.migrate(req.params,function(err,result){
        if(err)
            res.send(400,err);
        else{
            res.send(200,'ok');
            newRestaurantMessage({id:req.params._id,cusine:req.params.cusine,city:req.params.city});
        }
    });
}
function saveGoogleRestaurant(req,res,next){
    place_id = req.params.place_id;
    console.log(place_id);
    axios.get('https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyCAf1bsJ0evGejLB4-SKH-oh4m5ve_Uiq8&placeid='+place_id).then(response=>{
        details = response.data.result;
        var restaurant = {};
        details.address_components.forEach(level=>{
            if(level.types){
                for(i=0;i<level.types.length;i++){
                    if(level.types[i] === "administrative_area_level_2")
                       restaurant.city = level.long_name;
                }
            }
        });
        restaurant.address = details.formatted_address;
        restaurant.name = details.name;
        restaurant.location1 = details.geometry.location.lat;
        restaurant.location2 = details.geometry.location.lng;
        restaurant.number = details.international_phone_number || details.formatted_phone_number;
        restaurant.reviews = details.reviews;
        restaurant.rating = details.rating;
        restaurant.placeid = place_id;
        restaurant.cusine = 'TBA';
        restaurantProvider.save(restaurant,function(err,docs){
            if(err)
                console.log(err);
            else {
                res.send(200,docs);
                newRestaurantMessage({id:docs._id,cusine:docs.cusine,city:docs.city});
            }
        });
    }).catch(err=>{
        console.log(err.response);
        console.log(err.message);
    });
}
server.post('/new',create_new_restaurant);
server.get('/all',get_all_restaurants);
server.post('/delete/photo',deletePhoto);
server.get('/health',health);
server.post('/edit/restaurant',editRestaurant);
server.get('/restaurant/:id',getRestaurant);
server.post('/newMenuItem/:id',addMenuItem);
server.post('/editItem/:id',editItem);
server.post('/deleteMenuItem',deleteMenuItem);
server.post('/deleteRestaurant',deleteRestaurant);
server.post('/followRestaurant',followRestaurant);
server.post('/unfollowRestaurant',unfollowRestaurant);
server.post('/bookmark',bookmarkRestaurant);
server.post('/unbookmark',unbookmarkRestaurant);
server.get('/restaurantName',getRestaurantByName);
server.get('/categories',getCategories);
server.get('/dishSearch',dishSearch);
server.get('/categorySearch',categorySearch);
server.post('/migrate',migrate);
server.post('/saveGoogleRestaurant',saveGoogleRestaurant);
server.listen(8080);
