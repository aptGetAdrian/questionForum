const Question = require('../models/questionsModel.js'); 
const marked = require('marked');
const Comment = require('../models/commentsModel.js');

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
          const comments = await Comment.find({ question: req.params.id }).populate('author').lean();
      
          if (!question) return res.status(404).send('Question not found');
      
          let isOwner = false;
          if (req.session.userId && question.author) {
            isOwner = req.session.userId.toString() === question.author.toString();
          }
      
          // Add isCommentOwner property and userVote to each comment
          const enhancedComments = comments.map(comment => {
            const isCommentOwner =
              req.session.userId &&
              comment.author &&
              comment.author._id.toString() === req.session.userId.toString();
          
            let userVote = 0; // Default: no vote
            if (req.session.userId && comment.voters) {
              // Ensure comment.voters exists before calling .find()
              const voter = comment.voters.find(v =>
                v.userId && v.userId.toString() === req.session.userId.toString()
              );
              if (voter) {
                userVote = voter.vote; // 1 for upvote, -1 for downvote
              }
            }
            
            // Add isAccepted flag to the comment
            const isAccepted = question.acceptedAnswer && 
                              question.acceptedAnswer.toString() === comment._id.toString();
            
            return { ...comment, isCommentOwner, userVote, isAccepted };
          });
    
          // Sort comments: accepted answer first, then by score (highest to lowest)
          const sortedComments = enhancedComments.sort((a, b) => {
            // If one is accepted and the other isn't, the accepted one comes first
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            
            // Otherwise sort by score (highest first)
            return (a.createdAt || 0) - (b.createdAt || 0);
          });
          
          res.render('questions/show', {
            question,
            isOwner,
            comments: sortedComments,
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
    },

    acceptAnswer: async (req, res) => {
        try {
            const { questionId, answerId } = req.params;
            const userId = req.session.userId; 

            const answer = await Comment.findById(answerId);
            if (!answer || answer.question.toString() !== questionId) {
                return res.status(400).json({ error: "Answer does not belong to this question." });
            }

            const question = await Question.findById(questionId);
            if (!question) {
                return res.status(404).json({ error: "Question not found." });
            }
            if (question.author.toString() !== userId) {
                return res.status(403).json({ error: "Only the question author can accept answers." });
            }

            if (question.acceptedAnswer) {
                await Comment.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false });
            }

            await Comment.findByIdAndUpdate(answerId, { isAccepted: true });


            question.acceptedAnswer = answerId;
            await question.save();


            res.redirect(`/questions/${questionId}`);
            //res.status(200).json({ message: "Answer accepted successfully.", acceptedAnswer: answerId });
        } catch (err) {
            res.status(500).json({ error: "Server error: " + err.message });
        }
    },
};