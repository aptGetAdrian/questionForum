const Comment = require('../models/commentsModel.js');
const Question = require('../models/questionsModel.js');
const marked = require('marked'); // Don't forget to npm install marked

module.exports = {
    create: async (req, res) => {
        try {
            if (!req.session.userId) {
                return res.redirect('/users/login');
            }
    
            const { content } = req.body;
            if (!content) {
                throw new Error("Content is required.");
            }
    
            const htmlContent = marked.parse(content);
    
            const newComment = await Comment.create({
                content: htmlContent,
                author: req.session.userId,
                question: req.params.id  
            });

            await Question.findByIdAndUpdate(req.params.id, {
                $set: { lastActivity: new Date() }
              });
    
            return res.redirect(`/questions/${req.params.id}`);
    
        } catch (err) {
            const error2 = "500: Error posting comment";
                return res.render('error', { 
                    error2,
                    error: err
                });
        }
    },


    upvote: async (req, res) => {
        const { id: commentId, id3: userId } = req.params;
    
        try {
            const comment = await Comment.findById(commentId);
            const voter = comment.voters.find(v => v.userId.equals(userId));
            let userVote = 0; // Default value
    
            if (!voter) {
                comment.voters.push({ userId, vote: 1 });
                comment.score += 1;
                userVote = 1;
            } else if (voter.vote === 1) {
                voter.vote = 0;
                comment.score -= 1;
                userVote = 0;
            } else if (voter.vote === -1) {
                voter.vote = 1;
                comment.score += 2;
                userVote = 1;
            } else {
                voter.vote = 1;
                comment.score += 1;
                userVote = 1;
            }
    
            await comment.save();
    
            if (req.xhr) {
                return res.json({ 
                    score: comment.score,
                    userVote: userVote // Add the user's current vote status
                });
            } else {
                return res.redirect('back');
            }
        } catch (error) {
            const error2 = "500: Server error";
                return res.render('error', { 
                    error2,
                    error
                });
        }
    },
    

    downvote: async (req, res) => {
        const { id: commentId, id3: userId } = req.params;
    
        try {
            const comment = await Comment.findById(commentId);
            const voter = comment.voters.find(v => v.userId.equals(userId));
            let userVote = 0; // Default value
    
            if (!voter) {
                // User hasn't voted yet; add a downvote
                comment.voters.push({ userId, vote: -1 });
                comment.score -= 1;
                userVote = -1;
            } else if (voter.vote === -1) {
                voter.vote = 0;
                comment.score += 1;
                userVote = 0;
            } else if (voter.vote === 1) {
                voter.vote = -1;
                comment.score -= 2;
                userVote = -1;
            } else {
                voter.vote = -1;
                comment.score -= 1;
                userVote = -1;
            }
    
            await comment.save();
    
            // Check if the request is an AJAX request
            if (req.xhr) {
                return res.json({ 
                    score: comment.score,
                    userVote: userVote // Add the user's current vote status
                });
            } else {
                return res.redirect('back');
            }
        } catch (error) {
            const error2 = "500: Server error";
                return res.render('error', { 
                    error2,
                    error
                });
        }
    },

    deleteIndividual: async (req, res) => {
        try {
            await Comment.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Comment deleted successfully' });
        } catch (error) {
            const error2 = "500: Server error";
                return res.render('error', { 
                    error2,
                    error
                });
        }

    },

    updateComment: async (req, res) => {
            try {
                
                const updatedComment = await Comment.findByIdAndUpdate(
                    req.params.id,
                    { ...req.body, isEdited: true },
                    { new: true }
                );

                res.redirect(`/questions/${req.params.questionId}`);

            } catch (err) {


                res.status(400).render('questions/editComment', { 
                error: err.message,
                question: req.body
            });
            }
        },

    showEditForm: async (req, res) => {
            try {
                const question = await Question.findById(req.params.questionId);
                const comment = await Comment.findById(req.params.id);
                console.log("tu smo");
                res.render('questions/editComment', { question, comment });
            } catch (err) {
                res.status(404).send('Comment not found');
            }
        },


};