var express = require('express');
var router = express.Router();
var Parse = require('parse/node');

router.get('/', function(req, res, next) {
    res.render('start', {
        page: 'Start',
        message: 'Ready to start'
    });
});

router.post('/', function(req, res, next) {
    // Get all users. ForEach, get its records and save
    // If user has no records, don't export it
    var params = {
        order: 'created_at',
        count: true,
        limit: 500,
        response_json_depth: 1
    };

    global.arrowDBApp.usersQuery(params, function(err, result) {
        if (err) {
            res.render('start', {
                page: 'Start',
                message: err.message
            });
        } else {
            var async = require('async');

            //console.log(JSON.stringify(result.body, null, 2));
            // Execute all queries for each user synced
            async.eachSeries(result.body.response.users, function(user, callbackAllUsers) {
                //user = data.users[data.results.length - i];
                console.log("Updating for user: " + JSON.stringify(user.username));

                global.arrowDBApp.customObjectsQuery({
                    classname: 'Scores',
                    where: {'user_id': user.id},
                    limit: 30,
                    response_json_depth: 1
                }, function(err, result) {
                    if (err) {
                        console.log('Failed to get scores for: ' + user.username);
                        callbackAllUsers('Failed to get scores for: ' + user.username);
                    } else {
                        var scores = result.body.response.Scores;
                        console.log('Total scores for this user: ' + scores.length);

                        // If user has no records, don't export it
                        if (scores.length > 0) {
                            // Has records, import (create) him and import his records
                            var parseUser = new Parse.User();
                            parseUser.set("username", user.username);
                            parseUser.set("password", "1a2s3d");
                            parseUser.set("email", user.email);
                            parseUser.set("country", user.custom_fields.country);
                            parseUser.set("birth", String(user.custom_fields.birth));

                            // ACL to restrict no public read access
                            // NOTE: Not needed, CLP applied on Users currently, but better
                            var acl = new Parse.ACL();
                            acl.setPublicReadAccess(false);
                            parseUser.setACL(acl);

                            parseUser.signUp(null, {
                                success: function(newUser) {
                                    console.log('User imported: ', JSON.stringify(newUser, null, 2));

                                    // Import scores (ensure import before logout)
                                    async.eachSeries(scores, function(score, callbackNewScore) {
                                        var ParseScore = Parse.Object.extend("Scores");
                                        var parseScore = new ParseScore();

                                        parseScore.set("game", score.game);
                                        parseScore.set("level", score.level);
                                        parseScore.set("value", score.value);
                                        parseScore.set("username", newUser.toJSON().username);
                                        parseScore.set("user", newUser);

                                        // ACL to restrict write only to user, and public read access
                                        var acl = new Parse.ACL();
                                        acl.setWriteAccess(newUser, true);
                                        acl.setPublicReadAccess(true);
                                        parseScore.setACL(acl);

                                        parseScore.save(null, {
                                            success: function(newScore) {
                                                console.log('New score created with objectId: ' + JSON.stringify(newScore));
                                                console.log("                                 ");
                                                callbackNewScore();
                                            },
                                            error: function(newScore, error) {
                                                console.log('Failed to create new object, with error code: ' + error.message);
                                                callbackNewScore('Failed to create new object, with error code: ' + error.message);
                                            }
                                        });

                                    }, function(err) {
                                        // if any of the user processing produced an error, err would equal that error
                                        if (err) {
                                            // One of the iterations produced an error.
                                            // All processing will now stop.
                                            console.log('A score failed to process: ' + err);
                                        } else {
                                            console.log('All scores for user ' + user.username + ' have been processed successfully');
                                        }

                                        // Remove the saved user session
                                        executeQuery("POST", "logout", {}, newUser.toJSON().sessionToken, function() {
                                            console.log('User logged out');
                                        });
                                        callbackAllUsers();
                                    });
                                },

                                error: function(user, error) {
                                    // Show the error message somewhere and let the user try again.
                                    console.log("Error importing user to Parse: " + JSON.stringify(error));
                                    callbackAllUsers();
                                }
                            });
                        } else {
                            console.log('No scores for user ' + user.username + '. User not imported');
                            callbackAllUsers('No scores for user ' + user.username + '. User not imported');
                        }
                    }
                });

            }, function(err) {
                // if any of the user processing produced an error, err would equal that error
                if (err) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    console.log('A user failed to process: ' + err);
                } else {
                    console.log('All users have been processed successfully');
                }

                res.render('start', {
                    page: 'Start',
                    message: 'All users have been processed successfully'
                });
            });
        }
    });
});

function executeQuery(method, path, data, token, onComplete) {
    var https = require('https');
    var keys = require("../keys");

    if (method.toUpperCase() === 'POST') data = require('querystring').stringify(data);

    // Configure the options for the request
    var options = {
        host: keys.PARSE.REST_URL,
        //port: '443',
        method: method,
        path: "/" + path,
        headers: {
            "Content-Type": "application/json",
            "X-Parse-Application-Id": keys.PARSE.APP_KEY,
            "X-Parse-REST-API-Key": keys.PARSE.REST_KEY,
            "X-Parse-Session-Token": (typeof token === 'undefined') ? '' : token
        }
    };
    //console.log('options: ' + JSON.stringify(options));
    //console.log('options: ' + JSON.stringify(options.path));

    // Set up the request
    var request = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) {
            //console.log('res is: ' + data);
            if (typeof onComplete === 'function') {
                onComplete(data);
            } else {
                return data;
            }
        });
    });

    request.on('error', function(e) {
      console.error("Error in request: " + e);
    });

    // Post the data and finish the request
    if (method.toUpperCase() === 'POST') request.write(data);
    request.end();
    //console.log(request._headers);
}

module.exports = router;
