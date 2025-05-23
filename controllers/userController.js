var UserModel = require('../models/userModel.js');
const Question = require('../models/questionsModel.js');
const upload = require('../public/javascripts/upload.js');
const Comment = require('../models/commentsModel.js');
const commentsModel = require('../models/commentsModel.js');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    list: function (req, res) {
        UserModel.find(function (err, users) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            return res.json(users);
        });
    },


    show: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            return res.json(user);
        });
    },

    create: function (req, res) {
        var user = new UserModel({
			username : req.body.username,
			password : req.body.password,
			email : req.body.email
        });

        user.save(function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating user',
                    error: err
                });
            }

            //return res.status(201).json(user);
            return res.redirect('/users/login');
        });
    },


    update: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            user.username = req.body.username ? req.body.username : user.username;
			user.password = req.body.password ? req.body.password : user.password;
			user.email = req.body.email ? req.body.email : user.email;
			
            user.save(function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating user.',
                        error: err
                    });
                }

                return res.json(user);
            });
        });
    },


    remove: function (req, res) {
        var id = req.params.id;

        UserModel.findByIdAndRemove(id, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the user.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    },

    showRegister: function(req, res){
        res.render('user/register');
    },

    showLogin: function(req, res){
        res.render('user/login');
    },

    login: function(req, res, next){
        UserModel.authenticate(req.body.username, req.body.password, function(err, user){
            if(err || !user){
                var err = new Error('Wrong username or paassword');
                err.status = 401;
                return next(err);
            }
            req.session.userId = user._id;
            res.redirect('/users/userProfile');
        });
    },


    userProfile: async function(req, res, next) { 
        try {
            const questions = await Question.find({ author: req.session.userId }).lean();  
            const user = await UserModel.findById(req.session.userId).lean();
            const numComments = await Comment.countDocuments({ author: req.session.userId });
            const numQuestions = await Question.countDocuments({ author: req.session.userId });
            const numAcceptedComments = await Comment.countDocuments({ author: req.session.userId, isAccepted: true });

            const comments = await Comment.find({ author: req.session.userId }).lean();
            const totalScore = comments.reduce((sum, comment) => sum + (comment.score || 0), 0);
            const averageScore = totalScore / numComments;
            
    
            if (!user) {
                const err = new Error('Not authorized, go back!');
                err.status = 400;
                return next(err);
            }
    
            return res.render('user/userProfile', { 
                user,
                questions,
                numComments,
                numQuestions,
                totalScore,
                numAcceptedComments,
                averageScore
            });
        } catch (error) {
            const error2 = "500: Error creating profile";
                return res.render('error', { 
                    error2,
                    error
                });
        }
    },


    logout: function(req, res, next){
        if(req.session){
            req.session.destroy(function(err){
                if(err){
                    return next(err);
                } else{
                    return res.redirect('/');
                }
            });
        }
    },
    

    setPicture: async(req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).send(err.message);
            }
            
            if (!req.file) {
                return res.status(400).send('No file uploaded');
            }
            
            try {
                const relativePath = '/images/' + req.file.filename;
                
                await UserModel.findByIdAndUpdate(
                    req.session.userId, 
                    { profilePicture: relativePath }
                );
                
                res.redirect('/users/userProfile');
            } catch (error) {
                const error2 = "500: Error updating profile picture";
                return res.render('error', { 
                    error2,
                    error
                });
            }
        });
    },

    publicUserProfile: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ username: req.params.username}).lean();
            const questions = await Question.find({ author: user._id }).lean();  
            
            const numComments = await Comment.countDocuments({ author: user._id });
            const numQuestions = await Question.countDocuments({ author: user._id });
            const numAcceptedComments = await Comment.countDocuments({ author: user._id, isAccepted: true });

            const comments = await Comment.find({ author: user._id}).lean();
            const totalScore = comments.reduce((sum, comment) => sum + (comment.score || 0), 0);
            var averageScore = parseFloat((totalScore / numComments).toFixed(1));
            if (isNaN(averageScore)) {
                averageScore = 0;
            }
    
            if (!user) {
                const err = new Error('Not authorized, go back!');
                err.status = 400;
                return next(err);
            }

            if (req.session && req.session.userId) {
                if (req.session.userId == user._id.toString()) {
                    return res.render('user/userProfile', { 
                        user,
                        questions,
                        numComments,
                        numQuestions,
                        totalScore,
                        numAcceptedComments,
                        averageScore
                    });
                } else {
                    return res.render('user/publicUserProfile', { 
                        user,
                        questions,
                        numComments,
                        numQuestions,
                        totalScore,
                        numAcceptedComments,
                        averageScore
                    });
                }
            } else {
                return res.render('user/publicUserProfile', { 
                    user,
                    questions,
                    numComments,
                    numQuestions,
                    totalScore,
                    numAcceptedComments,
                    averageScore
                });
            }
    
            
        } catch (error) {
            const error2 = "403: Access denied";
            return res.render('error', { 
                error2,
                error
            });


        }



    }




};
