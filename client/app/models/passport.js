module.exports = function(app){
	

let passport = require('passport'), 
	LocalStrategy = require('passport-local').Strategy;

	let flash = require('connect-flash');
	let session = require('express-session');
	let cookieParser = require('cookie-parser');

	app.use(session({
	 secret: 'mylittlesecret',
	 resave:true,
	 saveUninitialized: true
	}));

	app.use(passport.initialize());
	app.use(passport.session());
	app.use(flash());


	passport.serializeUser(function(user, done){
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done){

		var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
		var ajax3 = new XMLHttpRequest();

		ajax3.open("GET","http://localhost:8080/api_users_by_id/"+id)
		ajax3.onreadystatechange = function(){
			if (ajax3.readyState === 4){
					var data_ = JSON.parse(ajax3.responseText);
					done(null, data_);
			} 
		}
		ajax3.send();
	 });

	passport.use(
	  'local-signup',
	  new LocalStrategy({
	   usernameField : 'username',
	   passwordField: 'password',
	   passReqToCallback: true
	  },
	  function(req, username,password, done){

	  	console.log("local-signup called");

	   	let bcrypt = require('bcrypt-nodejs');
	   	var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
		var ajax = new XMLHttpRequest();
	   
			//monta requisicao
			ajax.open("GET","http://localhost:8080/api_users/"+username);

			ajax.onreadystatechange = function(){
				if (ajax.readyState === 4){
					var data = JSON.parse(ajax.responseText);

					if (isEmpty(data)){
						var ajax2 = new XMLHttpRequest();
						ajax2.open("POST","http://localhost:8080/api_users/");

						var jsonUser = {
							username: username,
							name: req.body.name,
							password: bcrypt.hashSync(password, null, null),
							cnpj: req.body.cnpj
						}

						ajax2.onreadystatechange = function (){
							if (ajax2.readyState == 4){
								console.log()
								var response = JSON.parse(ajax2.responseText);

								console.log("jsonUser"+response._id);

								jsonUser._id = response._id;
								console.log("local-signup finished created user");
								
	       						return done(null, jsonUser);
							} 
						}
						ajax2.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
						ajax2.send(JSON.stringify(jsonUser));
						
					} else {
						console.log("local-signup finished existing user");
						return done(null, false, req.flash("signupMessage", 'Esse usuario ja existe.'));
						
					}
				} 
			}

			ajax.send();
		
	  })
	);

	passport.use(
	'local-login',
		new LocalStrategy({
	   	usernameField : 'username',
	   	passwordField: 'password',
	   	passReqToCallback: true
	},
	function(req, username, password, done){
	   	let bcrypt = require('bcrypt-nodejs');

		var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
		var ajax = new XMLHttpRequest();

		ajax.open("GET","http://localhost:8080/api_users/"+username)
		ajax.onreadystatechange = function(){

			if (ajax.readyState==4){
			console.log("ajax"+ajax.responseText);
			var data = JSON.parse(ajax.responseText);

			if(isEmpty(data))
	    	return done(null, false, req.flash("loginMessage", 'Usuário não encontrado.'));
	    

			if(!bcrypt.compareSync(password, data.password))
	     	return done(null, false, req.flash("loginMessage", 'Senha incorreta'));
	
	     	return done(null, data);
	     }
		}

		ajax.send();
	  })
	 );

	function isEmpty(obj) {
    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }

	    return true;
	}

return passport;

}