const Question = require('../models/questionsModel.js'); // Assuming you have a Question model
const marked = require('marked');

module.exports = {
    
    list: async (req, res) => {
        try {
        const questions = await Question.find();
        res.render('questions/list', { questions });
        } catch (err) {
        res.status(500).send(err.message);
        }
    },
    
    show: async (req, res, next) => {
        try {
            const question = await Question.findById(req.params.id).lean();
            if (!question) return res.status(404).send('Question not found');
        
            let isOwner = false;
            if (req.session.userId && question.author) {
              isOwner = req.session.userId.toString() === question.author.toString();
            }
        
            res.render('questions/show', {
              question,
              isOwner,
              session: req.session
            });
          } catch (err) {
            next(err);
          }
    },

    showCreateForm: function(req, res){
        if (!req.session.userId) {
            return res.redirect('/users/login'); // Require login to post questions
        }
        return res.render('questions/new', {
            title: 'Ask New Question',
            user: req.session.userId // Pass user info if needed
        });
    },


    create: async (req, res) => {
        try {
            // 1. Validate session
            if (!req.session.userId) {
                return res.redirect('/users/login');
            }
    
            // 2. Validate input
            const { title, content } = req.body;
            if (!title || !content) {
                throw new Error("Title and content are required.");
            }
    
            // 3. Convert Markdown to HTML
            const htmlContent = marked.parse(content);
    
            // 4. Create question
            const newQuestion = await Question.create({
                title,
                content: htmlContent,
                author: req.session.userId
            });
    
            // 5. Redirect on success
            return res.redirect(`/questions/${newQuestion._id}`);
    
        } catch (err) {
            console.error("[ERROR] Question creation failed:", err.message);
            return res.status(400).render('questions/new', {
                title: 'Ask New Question',
                error: err.message,
                previousValues: req.body // Repopulate form fields
            });
        }
    },
    

    showEditForm: async (req, res) => {
        try {
        const question = await Question.findById(req.params.id);
        res.render('questions/edit', { question });
        } catch (err) {
        res.status(404).send('Question not found');
        }
    },

    update: async (req, res) => {
        try {
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.redirect(`/questions/${updatedQuestion._id}`);
        } catch (err) {
        res.status(400).render('questions/edit', { 
            error: err.message,
            question: req.body
        });
        }
    },

    remove: async (req, res) => {
        try {
        await Question.findByIdAndDelete(req.params.id);
        res.redirect('/');
        } catch (err) {
        res.status(500).send(err.message);
        }
    }
};