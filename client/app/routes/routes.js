module.exports = function(application){


const { google } = require('googleapis');

const customsearch = google.customsearch('v1');

	application.get('/search_noticias_', (req, res, next) => {

	const { q,user, start, num } = req.query;
	console.log(q, user, start, num);

	customsearch.cse.list({
		auth: "AIzaSyACbmlMe3XE5_Y4m_UXjh8e37gIOYfTcfg",
		cx: "001130592152700400660:4sionosrol8",
		q, start, num
	})
		.then(result => result.data)
		.then((result) => {
		const { queries, items, searchInformation } = result;

		const page = (queries.request || [])[0] || {};
		const previousPage = (queries.previousPage || [])[0] || {};
		const nextPage = (queries.nextPage || [])[0] || {};

		const data = {
			q,
			items: items.map(o => ({
			link: o.link,
			title : o.title
			}))
		}

		console.log(data.items);
		// res.status(200).send(result);
			res.render('home/feed_noticias.ejs',{
				news : JSON.stringify(data.items).replace(/'/g, "\\'"),
				user : user

			});
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send(err);
		});
	});
	//handle login
	let passport = require("../models/passport.js")(application);

	application.get('/search_noticias', isLoggedIn, function(req, res){
		res.render('home/search_noticias.ejs', {
			user : req.user
		});
	});

	application.get('/post/:id', function(req, res){
		res.render('home/post.ejs', {
		  		profiler : req.params.id,
		   		user:req.user
		});
	});

	application.get('/login', function(req, res){
		if (req.user) {
			res.redirect('/dashboard');
		} else {
			res.render('index/login.ejs', {message: req.flash('loginMessage')});
		}
	});


	application.post('/login', passport.authenticate('local-login', {
		successRedirect: '/search_noticias',
	  	failureRedirect: '/login',
	  	failureFlash: true
	}),
		function(err,req, res){
	   		if(req.body.remember){
	    		req.session.cookie.maxAge = 1000 * 60 * 3;
	   		}else{
	    		req.session.cookie.expires = false;
	   		}
	   		res.redirect('/login');
	});

	application.get('/registre_se', function(req, res){
		if (req.user) {
			res.redirect('/search_noticias');
		}
	  	res.render('index/registre_se.ejs', {message: req.flash('signupMessage')});
	});

	application.post('/registre_se', passport.authenticate('local-signup', {
	  	successRedirect: '/search_noticias',
	  	failureRedirect: '/registre_se',
	  	failureFlash: true
	}));

	function isLoggedIn(req, res, next){
	 	if(req.isAuthenticated())
	  		return next();

	 	res.redirect('/login');
	}

	application.get('/logout', function(req,res){
			req.logout();
		  	res.redirect('/login');
	});

}