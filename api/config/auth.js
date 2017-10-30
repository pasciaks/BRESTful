const crypto = require('crypto');
const User = require('../models/User');


exports.getApiKey = function(user){
    let apiKey =  crypto.createHash('sha256').update(user.privateKey + user.id + Date.now()).digest('hex') + ':' + user.id +':'+ Date.now();
    console.log("a new api key: " + apiKey);
    return apiKey;
};

exports.isGetAuthenticated = function(req, res, next){
    if(typeof req.query.apiKey !== 'undefined' &&  req.query.apiKey !== ''){
        console.log('api key ' + req.query.apiKey);
        let apiKeyData = req.query.apiKey.split(':');
        let reqKey = apiKeyData[0];
        let userId = apiKeyData[1];
        let timeCreated = apiKeyData[2];
        User.findById(userId, function(err, user){
            if (err) { return next(err); }
            let keyCheck = crypto.createHash('sha256').update(user.privateKey + user.id + timeCreated).digest('hex');
            if(keyCheck === reqKey){
                req.userId = user.id;
                let keyAge = Date.now() - timeCreated;
                if(keyAge > 3600000 ){
                    return res.json({success: false, apiKey: '', message: 'Your session is expired please log in again.'})
                }
                console.log("isAuthenticated " + req.userId);
                return next();
            }
        });
    }
    else{
        return res.send("Failed to Authenticate");
    }

};

exports.isPostAuthenticated = function(req, res, next){
    if(typeof req.body.apiKey !== 'undefined' &&  req.body.apiKey !== ''){
        let apiKeyData = req.body.apiKey.split(':');
        let reqKey = apiKeyData[0];
        let userId = apiKeyData[1];
        let timeCreated = apiKeyData[2];
        User.findById(userId, function(err, user){
            if (err) { return next(err); }
            let keyCheck = crypto.createHash('sha256').update(user.privateKey + user.id + timeCreated).digest('hex');
            if(keyCheck === reqKey){
                req.userId = user.id;
                let keyAge = Date.now() - timeCreated;
                if(keyAge > 3600000 ){
                    return res.json({success: false, apiKey: '', message: 'Your session is expired please log in again.'})
                }
                console.log("isAuthenticated " + req.userId);
                return next();
            }
        });
    }
    else{
        return res.send("Failed to Authenticate");
    }
};