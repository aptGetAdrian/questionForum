const Comment = require('../models/commentsModel.js');
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
    
            return res.redirect(`/questions/${req.params.id}`);
    
        } catch (err) {
            console.error("[ERROR] Comment creation failed:", err.message);
            // You might want to redirect back with error message
            return res.redirect(`/questions/${req.params.id}?error=${encodeURIComponent(err.message)}`);
        }
    },


    downvote: async (req, res) => {
        try {
            if (!req.session.userId) {
                return res.redirect('/users/login');
            }

            const commentId = req.params.id;


        } catch (err) {
            return res.redirect(`/questions/${req.params.id}?error=${encodeURIComponent(err.message)}`);
        }


    }
};