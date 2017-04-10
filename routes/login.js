var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
    global.arrowDBApp.usersLogin({
        // Get fields from form
        login: req.body.username,
        password: req.body.password
    }, function(err, result) {
        if (err) {
            console.log('Error login: ' + err.message);
            next(new Error(err.message));
        } else {
            // Set session data to be used later through the app
            req.session.session_id = result.body.meta.session_id;
            req.session.userdata = result.body.response.users[0];
            req.session.username = req.body.username;

            res.redirect('/start');
        }
    });
});

router.get('/', function(req, res, next) {
    delete req.session.session_id;
    delete req.session.userdata;
    delete req.session.username;

    global.arrowDBApp.usersLogout(function(err, result) {
        res.redirect('/');
    });
});

module.exports = router;
