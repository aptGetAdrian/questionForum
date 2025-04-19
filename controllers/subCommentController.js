const subComment = require('../models/subCommentModel.js');
const marked = require('marked');
const Comment = require('../models/commentsModel.js');

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
    
            const newSubComment = await subComment.create({
                content: htmlContent,
                author: req.session.userId,
                question: req.params.id2,
                comment:  req.params.id,
            });

            await Comment.findByIdAndUpdate(req.params.id, {
                $push: { subComments: newSubComment._id }
            });
    
            return res.redirect(`/questions/${req.params.id2}`);
    
        } catch (err) {
            console.error("[ERROR] Comment creation failed:", err.message);
            // You might want to redirect back with error message
            return res.redirect(`/questions/${req.params.id2}?error=${encodeURIComponent(err.message)}`);
        }
    }


};