var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session && req.session.session_id) {
        res.redirect('/start');
    } else {
        res.render('index', {
            page: 'Home'
        });
    }
});

module.exports = router;
