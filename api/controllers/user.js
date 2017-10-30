const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../config/auth');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '{{{YOUR EMAIL HERE}}}',
        pass: '{{{PASSWORD}}}'
    }
});

exports.doChangePassword = (req,res) => {
    User.findOne({email: req.body.email.toLowerCase()}, (err, user) => {
        if (err) return res.json({success: false, message: err});
        if (user === null) return res.json({success: false, message: 'Invalid Email'});
        if(user.passwordResetCode === req.body.passwordResetCode){
            if(user.passwordResetExpires > Date.now()){
                user.password = req.body.password;
                user.save((err) => {
                    if (err) return res.json({success: false, message: err});
                    res.send({success: true, message:'successfully changed password.'});
                });
            }
            else{
                return res.json({success: false, message: 'Reset Code has Expired. Please Request a new one.'});
            }
        }
        else{
            return res.json({success: false, message: 'Invalid Reset Code'});
        }
    })
};

/**
 * Post /doManageProfile
 * Edit Profile
 */
exports.doManageProfile = (req,res) => {
    User.findById(req.userId, (err, user) => {
        if(user.email !== req.body.email){
            User.findOne({ email: req.body.email }, (err, existingUser) => {
                if (err) {
                    return err;
                }
                if (existingUser) {
                    return res.send('Account with that email address already exists.');
                }
            })
        }
        user.email = req.body.email;
        user.profile.name = req.body.name;
        user.profile.school = req.body.school;
        user.profile.other = req.body.other;
        user.profile.rsvp = req.body.rsvp;
        user.save((err) => {
            if (err) { return next(err); }
            res.send({success: true, message:'successfully edited profile.'});
        });
    });
};

/**
 * POST /doSignIn
 * Sign in using email and password.
 */
exports.doSignIn = (req, res) => {
    User.findOne({email: req.body.email.toLowerCase()}, (err, user) => {
        if (err) return res.json({success: false, message: err});
        if (user === null) return res.json({success: false, message: 'Invalid Username or Password'});
        console.log("req.body.password " + req.body.password + " user pass " + JSON.stringify(user));
        user.comparePassword(req.body.password, function(result){
            if(result === true){
                return res.json({success: true, apiKey: auth.getApiKey(user), message: 'Successfully Logged In'})
            }
            else{
                res.json({success: false, message: 'Invalid Username or Password'})
            }
        });
    })
};

/**
 * POST /doRegister
 * Create a new local account.
 */
exports.doRegister = (req, res, next) => {
    const user = new User({
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        privateKey:  crypto.createHash('sha256').update('brendanisgreat'+Math.random() * 1872389213).digest('hex'),
        profile:{
            name: req.body.name,
            school: req.body.school,
            other: req.body.other
        }
    });

    User.findOne({ email: req.body.email.toLowerCase() }, (err, existingUser) => {
        if (err) { return next(err); }
        if (existingUser) {
            return res.send('Account with that email address already exists.');
        }
        user.save((err) => {
            if (err) { return next(err); }
            res.send({success: true, message:'successfully registered.'});
        });
    });
};

exports.forgotPassword = (req, res) => {
    User.findOne({email: req.query.email.toLowerCase()}, (err, user) => {
        if (err) return res.json({success: false, message: err});
        if (user === null) return res.json({success: false, message: 'Invalid username'});
        user.passwordResetCode = Math.floor(Math.random()*90000) + 10000;
        user.passwordResetExpires = Date.now() + 86400000;
        user.save((err) => {
            if (err) { return res.json({success: false, message: err}); }
            let mailOptions = {
                from: '',
                to: user.email,
                subject: 'Forgot Password - Hack Volusia',
                html: '<h1>Hack Volusia</h1><p>To reset your password with Hackvolusia.com please use this reset code: <b>'+ user.passwordResetCode+'</b>, on the password reset page. Code will expire in 24 hours. If you did not request to change your password please ignore this email or contact us at info@hackvolusia.com</p>'
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            return res.json({success: true, email: user.email});
        });
    })
};

/**
 * GET /accountProfile
 * Get Profile so user can manage.
 */
exports.getProfile = (req,res) => {
    User.findById(req.userId, (err, user) => {
        if (err) { return err; }
        res.json({success: true, profile: user.profile, email: user.email});
    })
};

/**
 * GET /isLoggedIn
 * Check if user is logged in for navbar return user info.
 */
exports.isLoggedIn = (req, res) => {
    User.findById(req.userId, (err, user) => {
        if (err) { return err; }
        res.send({success: true, email: user.email});
    })
};
