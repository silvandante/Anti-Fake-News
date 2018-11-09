var app = require ("./config/server.js");

var http = require('http').createServer(app);
var io = require("socket.io")(http);

io.origins('*:*');

http.listen(8080, function(){
	console.log('Server side instagram_clone_v01 online');
});


io.on('connect', function(socket){
	console.log("socket.id"+socket.id);	
});

io.on('newPhoto', function(){
	console.log("recebeu");	
});

var flatten = require('flat');

var mongodb = require("mongodb");

let db = new mongodb.Db(
		'anti_fake_news',
		new mongodb.Server(
			'localhost',
			27017,
			{}),
		{}
	);

let fs = require("fs");

let objectId = require('mongodb').ObjectId;

console.log("HTTP server is listening at port " + 8080);

app.post("/api_post_pic", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");

	res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
	res.setHeader('Access-Control-Allow-Credentials', true);

	//allow access control to all applications origins (*)
	var date = new Date();
	var time_stamp = date.getTime();

	var path_origin = req.files.arquivo.path;
	var path_destiny = "./uploads/" + time_stamp + "_" + req.files.arquivo.originalFilename;

	fs.rename(path_origin, path_destiny, function(err){
		if (err){
			res.status(500).json({error: err});
			return;
		} 

		var data = {
			url_imagem: time_stamp + "_" + req.files.arquivo.originalFilename,
			titulo: req.body.titulo,
			date_posted: date,
			username: req.body.username
		}

		db.open( function(err,mongoclient){
			mongoclient.collection('users', function(err,collection){
				collection.find({username : req.body.username}).toArray(function(err,records){
					mongoclient.close();
					
					if (err)
						console.log("err"+err);


					data._idUser = records[0]._id.toHexString();

					db.open( function(err,mongoclient){
						mongoclient.collection('postagem', function(err,collection){
							collection.insert(data, function(err,records){
								if (err){
								res.json({'status': '0'});
								} else {
	
									io.sockets.emit('newPhoto');
									
								
									res.json({'status': '1'});
								}
								mongoclient.close();
							});
						});
					});
				});
			});
		});
	}); 
});

//configura a rotas com express
app.get("/", function(req,res){
	res.send({msg: "Olá"});
});

app.post("/api_post_profile", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	//allow access control to all applications origins (*)

	var date = new Date();
	var time_stamp = date.getTime();

	var path_origin = req.files.arquivo.path;
	var path_destiny = "./uploads/" + time_stamp + "_" + req.files.arquivo.originalFilename;

	fs.rename(path_origin, path_destiny, function(err){
		if (err){
			res.status(500).json({error: err});
			return;
		} 

		var data = {
			url_imagem: time_stamp + "_" + req.files.arquivo.originalFilename,
			name: req.body.name,
			localizacao: req.body.localizacao,
			bio: req.body.bio
		}

		db.open( function(err,mongoclient){
			mongoclient.collection('users', function(err,collection){
				collection.updateOne({username :req.body.username},
					{$set :{
						url_imagem: time_stamp + "_" + req.files.arquivo.originalFilename,
						name: req.body.name,
						localizacao: req.body.localizacao,
						bio: req.body.bio,
						}
						
					},{upsert:true}, function(err,records){
					if (err){
						console.log(err);
						res.json({'status': '0'});
					} else {
						res.json({'status': '1'});
					}
					mongoclient.close();
				});
			});
		});
	}); 
});



//get all posts do db
app.get("/api_pots", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.find().toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					res.json(results);
				}
				mongoclient.close();
			});
		});
	});
});



//get all posts by friends do db
app.get("/api_posts_by_friend/:username", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('users', function(err,collection){
			collection.find({username: req.params.username}).toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					mongoclient.close();

					var friends = [];
					if(results[0]._idFollowing != undefined){
					for (var i = 0 ; i < results[0]._idFollowing.length ; i++){
						friends.push(results[0]._idFollowing[i].following);
					}
						db.open( function(err,mongoclient){
						mongoclient.collection('postagem', function(err,collection){
							collection.find({username: {$in: friends}}).sort({date_posted: -1}).toArray(function(err,results){
								if (err){
									res.json(err);
								} else {
									res.json(results);
									
								}
								mongoclient.close();
							});
						});
						});
					}
				}
			});
		});
	});
});

//get all posts by me do db
app.get("/api_posts_by_me/:username", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('users', function(err,collection){
			collection.find({username: req.params.username}).toArray(function(err,results){
				if (err){
					mongoclient.close();
					res.json(err);
				} else {

					mongoclient.close();

					if (!isEmpty(results)){
						db.open( function(err,mongoclient){
						mongoclient.collection('postagem', function(err,collection){
							collection.find({_idUser: results[0]._id.toHexString()}).sort({date_posted: -1}).toArray(function(err,results){
								if (err){
									res.json(err);
								} else {
									res.json(results);
									
								}
								mongoclient.close();
							});
						});
						});
					}
				}
			});
		});
	});
});

	function isEmpty(obj) {
    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }

	    return true;
	}

//get post by id do db
app.get("/api/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.find(objectId(req.params.id)).sort({_id: -1}).toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					res.json(results);
				}
				mongoclient.close();
			});
		});
	});
});

app.get('/imagens/:imagem', function(req,res){
	let img = req.params.imagem;
	res.setHeader("Access-Control-Allow-Origin","*");
	fs.readFile('./uploads/'+img, function(err, content){
		if (err){
			res.status(400).json(err);
			return;
		}

		res.writeHead(200,{'content-type' : 'image/jpg'});
		res.end(content);

	});

});

//update titulo do post by id do db
app.put("/api_posts/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ _id : objectId(req.params.id) },
				{ $set : { titulo : req.body.titulo}},
				{},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});

app.get("/api_posts/:id", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");

	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.find({ _id : objectId(req.params.id) }).toArray(
				function(err, records){
					if (err){
						res.json(err);
					} else {
						console.log(records);

						res.send(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});

app.get("/api_get_profile_look_like/:id", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('users', function(err,collection){
			collection.find({ username : { $regex: req.params.id } }).toArray(
				function(err, records){
					if (err){
						res.json(err);
					} else {
						
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});


//insert comentario do post by id do db
app.put("/api_comentario/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ _id : objectId(req.params.id) },
				{ $push : {  
						comentarios : {
							id_comentario : new objectId(),
							comentario : req.body.comentario,
							username : req.body.username
						}
					}	
				},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						io.sockets.emit('newComment');
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});



//delete post by id do db
app.delete("/api_comentario/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ },
				{ $pull : {
						comentarios : { id_comentario : objectId(req.params.id) }
					}
				},
				{multi:true},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						res.json(records);
					}
					mongoclient.close();
				}
			);
		});
	});
});

var mongoose = require('mongoose');
let db_ = mongoose.connect('mongodb://localhost:27017/anti_fake_news',  { useNewUrlParser: true })
    .catch(err => console.error('Something went wrong', err));


const newsSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    link_news: String,
    fake_news: Array,
    true_news: Array
},{
    versionKey: false
});
 
const News = mongoose.model('News', newsSchema);

app.post("/api_get_noticia", function(req,res){
	var link = req.body.link;
	res.setHeader("Access-Control-Allow-Origin","*");
	News.findOne({link_news : link}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			console.log(req);
			res.json(req);
		}
	});
	
});

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    name: String,
    password: String,
    cnpj: String
},{
    versionKey: false
});
 
const User = mongoose.model('User', userSchema);

//get user by id
app.get("/api_users_by_id/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({_id : req.params.id}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

//get user by username
app.get("/api_get_profile/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({username : req.params.id}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			console.log("api_get_profile"+req);
			res.json(req);
		}
	});
	
});


//get all users by id
app.get("/api_users/", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	User.find().exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.get("/api_users/:username", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({username : req.params.username}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.post("/api_users/", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
		var newUser = new User();
		newUser._id = mongoose.Types.ObjectId();
		newUser.username = req.body.username;
		newUser.name = req.body.name;
		newUser.password = req.body.password;
		newUser.cnpj = req.body.cnpj;
		newUser.save(function(err, new_user){
	        if(err) {
	            res.send('error saving new user');
	        } else {
	        	console.log(newUser);
	            res.json(new_user);
	        }
		});
});

app.post("/insert_fake_news_into", function(req,res){

	var link = req.body.link;
	var user = req.body.user;

	News.findOne({link_news : req.body.link}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			if (isEmpty(req)){
				db.open( function(err,mongoclient){
						var data = {
						_id : new objectId(),
						link_news: link,
						fake_news : [],
						true_news : []
					}

					var fake_news = {
						_id : mongoose.Types.ObjectId(),
						user : user
					}

					data.fake_news.push(fake_news);

					mongoclient.collection('news', function(err,collection){
						collection.insert(data, function(err,records){

							mongoclient.close();

							if (err){
							} else {

								console.log("inseriu fake_news_into");
								res.json({"ok":1})
							}
						});
					});
				});
			} else {

			var arrayOfNewspapers = [];

			for (var i = 0 ; i < req.fake_news.length; i++){
				console.log("lol");
				arrayOfNewspapers.push(req.fake_news[i].user);
			}
			console.log(arrayOfNewspapers);

			if (arrayOfNewspapers.includes(user)){
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
				collection.update(
					{link_news : link},
					{ $pull : {
					fake_news : { user : user }
					}
					},
					{multi:true},
					function(err, records){
					if (err){
					console.log("nao excluiu");
					res.json(err);
					} else {
					console.log("excluiu");
					res.json(records);
					}
					mongoclient.close();
					}
					);
					});
				});
			} else {
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
					collection.update(
						{ link_news : link },
						{ $push : {  
							fake_news : {
							_id : new objectId(),
							user : user							}
						}	
					},
					function(err, records){
						mongoclient.close();
						if (err){
							console.log("err"+err);
							res.json(err);
						} else {
							console.log("inseriu into_fake_news");
							res.json(records);
						}
							mongoclient.close();
						}
					);
				});
			});
			}													
			}
		}
	});
});

/*
app.post("/insert_fake_news_into", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");

	console.log("req"+req.body.link);

	db.open( function(err,mongoclient){
		mongoclient.collection('news', function(err,collection){
			collection.find({ link_news : req.body.link }).toArray(
				function(err, records){
					if (err){
						res.json(err);
						console.log("error"+err);
					} else {
						mongoclient.close();
						if (isEmpty(records)){
							var data = {
								_id : new objectId(),
								link_news: req.body.link,
								fake_news : Array,
								true_news : Array
							}
							mongoclient.collection('news', function(err,collection){
								collection.insert(data, function(err,records){
									if (err){
										console.log("nao inseriu");
										res.json({'status': '0'});
									} else {
										mongoclient.close();
										
										mongoclient.collection('news', function(err,collection){
											collection.update(
												{ link_news : req.body.link },
												{ $push : {  
														fake_news : {
															_id : new objectId(),
															user : req.body.user
														}
													}	
												},
												function(err, records){
													if (err){
														res.json(err);
													} else {
														console.log("inseriu e deu update");
														res.json(records);
													}

													mongoclient.close();
												}
											);
										});
									}
									});
								});


						} else {
								mongoclient.collection('news', function(err,collection){
									collection.find({link_news : req.body.link}).toArray(function(err,results){
										if (err){
											res.json(err);
										} else {
											console.log("chegou aqui");
											var arrayOfNewspapers = [];
													if (!isEmpty(results[0].fake_news)){
																for (var i = 0 ; i < results[0].fake_news.length; i++){
																	console.log("lol");
																	arrayOfNewspapers.push(results[0].fake_news[i].user);
																}
																console.log(arrayOfNewspapers);

																if (arrayOfNewspapers.includes(req.body.user)){
																	mongoclient.close();
																	db.open( function(err,mongoclient){
																		mongoclient.collection('news', function(err,collection){
																			collection.update(
																				{link_news : req.body.link},
																				{ $pull : {
																						fake_news : { user : req.body.user }
																					}
																				},
																				{multi:true},
																				function(err, records){
																					if (err){

																						console.log("nao excluiu");
																						res.json(err);
																					} else {
																						console.log("excluiu");
																						res.json(records);
																					}
																					mongoclient.close();
																				}
																			);
																		});
																	});
																	
																} else {

																mongoclient.close();
															mongoclient.collection('news', function(err,collection){
																collection.update(
																	{ link_news : req.body.link },
																	{ $push : {  
																			fake_news : {
																				_id : new objectId(),
																				user : req.body.user
																			}
																		}	
																	},
																	function(err, records){
																		if (err){
																			console.log("err"+err);
																			res.json(err);
																		} else {
																			res.json(records);
																		}

																		mongoclient.close();
																	}
																);
														});

																}
															} else {
																mongoclient.close();
															mongoclient.collection('news', function(err,collection){
																collection.update(
																	{ link_news : req.body.link },
																	{ $push : {  
																			fake_news : {
																				_id : new objectId(),
																				user : req.body.user
																			}
																		}	
																	},
																	function(err, records){
																		if (err){
																			console.log("err"+err);
																			res.json(err);
																		} else {
																			res.json(records);
																		}

																		mongoclient.close();
																	}
																);
															});
															}

										}
								});
							});
						}
					}

				}
			);
		});
	});
});
*/

app.post("/insert_true_news_into", function(req,res){

	var link = req.body.link;
	var user = req.body.user;

	News.findOne({link_news : req.body.link}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			if (isEmpty(req)){
				db.open( function(err,mongoclient){
						var data = {
						_id : new objectId(),
						link_news: link,
						fake_news : [],
						true_news : []
					}

					var true_news = {
						_id : mongoose.Types.ObjectId(),
						user : user
					}

					data.true_news.push(true_news);

					mongoclient.collection('news', function(err,collection){
						collection.insert(data, function(err,records){

							mongoclient.close();

							if (err){
							} else {
								io.sockets.emit('update');
								console.log("inseriu true_news_into");
								res.json({"ok":1})
							}
						});
					});
				});
			} else {

			var arrayOfNewspapers = [];

			for (var i = 0 ; i < req.true_news.length; i++){
				console.log("lol");
				arrayOfNewspapers.push(req.true_news[i].user);
			}
			console.log(arrayOfNewspapers);

			if (arrayOfNewspapers.includes(user)){
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
				collection.update(
					{link_news : link},
					{ $pull : {
					true_news : { user : user }
					}
					},
					{multi:true},
					function(err, records){
					if (err){
					console.log("nao excluiu true_news_into");
					res.json(err);
					} else {
					io.sockets.emit('update');
					res.json(records);
					}
					mongoclient.close();
					}
					);
					});
				});
			} else {
				db.open( function(err,mongoclient){
				mongoclient.collection('news', function(err,collection){
					collection.update(
						{ link_news : link },
						{ $push : {  
							true_news : {
							_id : new objectId(),
							user : user							}
						}	
					},
					function(err, records){
						mongoclient.close();
						if (err){
							console.log("err"+err);
							res.json(err);
						} else {
							io.sockets.emit('update');
							res.json(records);
						}
							mongoclient.close();
						}
					);
				});
			});
			}													
			}
		}
	});
});

app.post("/api_get_noticia", function(req,res){

	var link = req.body.link;
	console.log("link:"+link);
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('news', function(err,collection){
			collection.find({link_news : link}).toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					console.log("results"+results);
					
					res.json(results);
					mongoclient.close();
				}
				
			});
		});
	});
});