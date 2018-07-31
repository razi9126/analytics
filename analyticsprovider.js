const monk=require('monk');
//const url='mongodb://localhost:27018'
const url='mongodb://restaurants-mongodb-replicaset-0.restaurants-mongodb-replicaset:27017,restaurants-mongodb-replicaset-1.restaurants-mongodb-replicaset:27017,restaurants-mongodb-replicaset-2.restaurants-mongodb-replicaset:27017/restaurants?replicaSet=rs0&slaveOk=true'
RestaurantProvider = function(host, port) {
    this.db=monk(url)
    this.db.then(()=>{
        console.log('connected to the database');
    }).catch((err)=>{
        console.log('not connected to the database')
        console.log(err);
    });
}
RestaurantProvider.prototype.houseKeeping = function(callback){
    var initialScore = {
        '1':0,
        '2':0,
        '3':0,
        '4':0,
        '5':0,
    }
    var initialDishScore = {
        taste : initialScore,
        valueForMoney:{
            'yes':0,
            'no':0,
        }
    }
    collection = this.db.get('production');
    collection.find().then(restaurants=>{
        for (i = 0; i<restaurants.length;i++){
            restaurant = restaurants[i];
            restaurant.count = 0;
            restaurant.paitooScores = initialScore;
            restaurant.generalScores = initialScore;
            if(restaurant.menu){
               for (j=0;j<restaurant.menu.length;j++){
                   dish = restaurant.menu[j];
                   dish.generalScores = initialDishScore;
                   dish.paitooScores = initialDishScore;
                   dish.count = 0;
                   if(j === restaurant.menu.length - 1){
                        console.log('here too');
                        console.log(typeof restaurant);
                        collection.update({_id:restaurant._id},restaurant).then(()=>{
                            callback();
                        }).catch(err=>{
                            callback(err);
                        });
                   }
               }
            } else {
                console.log('here');
                console.log(typeof restaurant);
                collection.update({_id:restaurant._id,},restaurant).then(()=>{
                    callback();
                }).catch(err=>{
                    callback(err);
                });
            }
        }
    }).catch(err=>{
        callback(err);
    });
}
RestaurantProvider.prototype.findAll = function(callback) {
   collection=this.db.get('production')
   if (collection==null){
    }else{
        collection.find({},'-menu').then((docs)=>{
            callback(null,docs)
        });
    }
};
RestaurantProvider.prototype.updateScore = function(story,callback){
    console.log(story);
    var initialScore = {
        '1':0,
        '2':0,
        '3':0,
        '4':0,
        '5':0,
    }
    var initialDishScore = {
        taste : initialScore,
        valueForMoney:{
            'yes':0,
            'no':0,
        }
    }
    collection = this.db.get('production');
    collection.findOne({_id:story.restaurant_id}).then(restaurant=>{
        if(!restaurant.count)
            restaurant.count = 0;
        restaurant.count++;
        if(story.paitoo){
            if(!restaurant.paitooScores)
                restaurant.paitooScores = initialScore;
            restaurant.paitooScores[story.score]++;
            if(story.category.length>0){
                story.category.forEach(dish=>{
                    restaurant.menu.forEach(restaurantDish=>{
                        if(restaurantDish.name===dish.name){
                            restaurantDish.paitooScores.taste[dish.taste]++;
                            restaurantDish.paitooScores.valueForMoney[dish.valueForMoney]++;
                        }
                    });
                });
             }
        } else {
            if(!restaurant.generalScores)
                restaurant.generalScores = initialScore;
            restaurant.generalScores[story.score]++;
            if(story.category.length>0){
                story.category.forEach(dish=>{
                    restaurant.menu.forEach(restaurantDish=>{
                        if(restaurantDish.name===dish.name){
                            restaurantDish.count++;
                            restaurantDish.generalScores.taste[dish.taste]++;
                            restaurantDish.generalScores.valueForMoney[dish.valueForMoney]++;
                        }
                    });
                });
             }
        }
        collection.update({_id:story.restaurant_id},restaurant).then(()=>{
            callback(null);
        }).catch(err=>{
            callback(err);
        });
    });
}
RestaurantProvider.prototype.deleteReview = function(story,callback){
    collection = this.db.get('production');
    collection.findOne({_id:story.restaurant_id}).then(restaurant=>{
        restaurant.count--;
        if(story.paitoo){
            restaurant.paitooScores[story.score]--;
            if(story.category.length>0){
                story.category.forEach(dish=>{
                    restaurant.menu.forEach(restaurantDish=>{
                        if(restaurantDish.name===dish.name){
                            restaurantDish.paitooScores.taste[dish.taste]--;
                            restaurantDish.paitooScores.valueForMoney[dish.valueForMoney]--;
                        }
                    });
                });
             }
        } else {
            restaurant.generalScores[story.score]--;
            if(story.category.length>0){
                story.category.forEach(dish=>{
                    restaurant.menu.forEach(restaurantDish=>{
                        if(restaurantDish.name===dish.name){
                            restaurantDish.count++;
                            restaurantDish.generalScores.taste[dish.taste]--;
                            restaurantDish.generalScores.valueForMoney[dish.valueForMoney]--;
                        }
                    });
                });
             }
        }
        collection.update({_id:story.restaurant_id},restaurant).then(()=>{
            callback(null);
        }).catch(err=>{
            callback(err);
        });
    });
}
RestaurantProvider.prototype.getRestaurantByName = function(query,callback){
    collection = this.db.get('production');
    collection.findOne({name:query.name}).then(restaurant=>{
        callback(null,restaurant);
    }).catch(err=>{
        callback(err);
    });
}
RestaurantProvider.prototype.getRestaurant=function(resId,callback){
    collection=this.db.get('production');
    collection.findOne({_id:resId.id}).then(restaurant=>{
        callback(restaurant);
    });
}
RestaurantProvider.prototype.editRestaurant=function(restaurant,callback){
    console.log(restaurant);
    collection=this.db.get('production');
    var cusineChanged=false;
    var cityChanged=false;
    collection.findOne({_id:restaurant._id}).then(doc=>{
        restaurant['menu']=doc.menu;
        if(doc.cusine!==restaurant.cusine)
            cusineChanged=true;
        if(doc.city!==restaurant.city)
            cityChanged=true;
        if(doc.images){
            doc.images.map(image=>{
                restaurant.images.push(image);
            });
        }
        collection.update({_id:restaurant._id},restaurant).then(()=>{
            callback(restaurant,cusineChanged,cityChanged);
        });
    })
}
RestaurantProvider.prototype.deletePhoto=function(image,callback){
    collection=this.db.get('production');
    collection.findOne({_id:image._id}).then(doc=>{
        doc.images=doc.images.filter(thisImage=>thisImage.mediaLink!=image.mediaLink);
        collection.update({_id:image._id},doc).then((something)=>{
            callback();
        });
    });
}
RestaurantProvider.prototype.save = function(req, callback) {
   var initialScore = {
        '1':0,
        '2':0,
        '3':0,
        '4':0,
        '5':0,
    }
    var initialDishScore = {
        taste : initialScore,
        valueForMoney:{
            'yes':0,
            'no':0,
        }
    }
    req.count=0;
    req.generalScores = initialScore;
    req.paitooScores = initialScore;
    try {
        collection=this.db.get('production');
        collection.insert(req).then((docs)=>{
            callback(null,docs);
            return;
        }).catch((err)=>{
            callback(err,null);
            return;
        });
    }catch(err){
        console.log(err);
    }
}
RestaurantProvider.prototype.addMenuItem=function(params,callback){
    collection=this.db.get('production');
    var initialScore = {
        '1':0,
        '2':0,
        '3':0,
        '4':0,
        '5':0,
    }
    var initialDishScore = {
        taste : initialScore,
        valueForMoney: {
            'yes':0,
            'no':0,
        }
    }
    collection.findOne({_id:params.id}).then(doc=>{
        if(!doc.menu){
            doc.menu=[];
        }
        console.log('found restaurant to add dish:'+JSON.stringify(params));
        console.log('the length of the menu is:'+doc.menu.length);
        doc.menu.push({name:params.name,category:params.category,generalScores:initialDishScore,paitooScores:initialDishScore});
        console.log('the length of the new menu is:'+doc.menu.length);
            collection.update({_id:params.id},doc).then((something)=>{
                console.log('document updated:'+something)
                callback();
            }).catch(err=>{
                console.log(err);
            });
    }).catch(err=>{
        console.log(err);
    });
}
RestaurantProvider.prototype.editItem = function(params,callback){
    deleteCategory=false;
    createCategory=true;
    collection = this.db.get('production');
    collection.findOne({_id:params.id}).then(doc=>{
        var count=0;
        doc.menu.forEach(function(item){
            if(item.category === params.originalCategory)
                count++;
            if(item.category===params.newCategory)
                createCategory=false;
            if(item.name=== params.originalName && item.category===params.originalCategory){
                item.name=params.newName;
                item.category=params.newCategory;
            }
        });
        if(count===1)
            deleteCategory=true;
        collection.update({_id:params.id},doc).then(doc=>{
            callback(null,deleteCategory,createCategory);
        }).catch(err=>{
            callback(err);
        });
    }).catch(err=>{
        callback(err);
    })
    /*
    collection.findOneAndUpdate({_id:params.id,"menu.name":params.originalName,"menu.category":params.originalCategory},{$set:{"menu.$.name":params.newName,"menu.$.category":params.newCategory}}).then(()=>{
        collection.find({_id:params.id,"menu.category":params.originalCategory}).then(doc=>{
            if (doc.length === 0){
                console.log('zero');
                deleteCategory=true;
            }
            collection.find({_id:params.id,"menu.category":params.newCategory}).then(doc=>{
                console.log('doc',doc);
                callback(null);
            }).catch(err=>{
                console.log(err);
                callback(err);
            });
        }).catch(err=>{
            console.log('err',err);
            callback(err);
        });
    }).catch(err=>{
        console.log('err',err);
        callback(err);
    });
    */
}

RestaurantProvider.prototype.deleteMenuItem=function(params,callback){
    collection=this.db.get('production');
    var onlyItem=true;
    collection.findOne({_id:params.id}).then(doc=>{
        doc.menu=doc.menu.filter(item=>item.name!=params.name);
        doc.menu.map(item=>{
            if(item.category===params.category)
                onlyItem=false;
        });
        collection.update({_id:params.id},doc).then(()=>{
            callback(onlyItem);
        });
    });
}

RestaurantProvider.prototype.deleteRestaurant=function(params,callback){
    collection=this.db.get('production');
    collection.findOne({_id:params.id}).then(doc=>{
        collection.remove({_id:params.id}).then(()=>{
            callback(doc);
        }).catch(err=>{
            console.log(err);
        });
    }).catch(err=>{
        console.log(err);
    });
}
RestaurantProvider.prototype.unfollowRestaurant = function(params,callback){
    collection=this.db.get('production');
    collection.findOneAndUpdate({_id:params.restaurant},{$pull:{followedBy:params.user}}).
        then(result=>{
            callback(null,result);
        }).catch(err=>{
            callback(err);
        });
}
RestaurantProvider.prototype.followRestaurant = function(params,callback){
    collection=this.db.get('production');
    console.log(params);
    collection.findOneAndUpdate({_id:params.restaurant},{$addToSet:{followedBy:params.user}}).
        then(result=>{
            collection.findOne({_id:params.restaurant}).then(doc=>{
                console.log(doc);
            });
            callback(null,result);
        }).catch(err=>{
            callback(err);
        });
}
RestaurantProvider.prototype.getCategories = function(callback){
    var results = [];
    collection = this.db.get('production');
    collection.find({}).then((docs)=>{
        docs.map(doc=>{
            if(doc.menu){
                doc.menu.map(dish =>{
                    results.push(dish.category);
                });
            }
        });
    results = Array.from(new Set(results));
    callback(null,results);
    }).catch(err=>{
        console.log(err);
        callback(err);
    });
}
RestaurantProvider.prototype.dishSearch = function(params,callback){
    var dish = params.dish;
    collection = this.db.get('production');
    collection.find({
        "menu.name":params.dish
    },{"menu.$":1,address:1,name:1,images:1,generalScores:1,paitooScores:1,stories:1}).then(docs=>{
        callback(null,docs);
    }).catch(err=>{
        callback(err);
    });
}
RestaurantProvider.prototype.categorySearch = function(params,callback){
    var category = params.category;
    collection = this.db.get('production');
    collection.aggregate([{$match:{"menu.category":category}},{$project:{name:1,generalScores:1,address:1,paitooScores:1,images:1,count:1,stories:1,menu:{$filter:{input:'$menu',as:'num',cond:{$eq:['$$num.category',category]}}}}}]).then(docs=>{
        callback(null,docs);
    }).catch(err=>{
        callback(err);
    });
}
RestaurantProvider.prototype.migrate = function(restaurant,callback){
    collection = this.db.get('production');
    collection.insert(restaurant).then(response=>{
        callback(null,response);
    }).catch(err=>{
        callback(err);
    });
}
exports.RestaurantProvider = RestaurantProvider
