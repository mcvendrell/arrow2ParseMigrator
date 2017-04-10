module.exports = function(req, res, next) {
    if (!req.session.session_id) {
        console.log('Anonymous trying to access...');
        next(new Error('It seems like your user name/password combination is wrong or your session has expired'));
    } else {
        // User is allowed
        return next();
    }
};
