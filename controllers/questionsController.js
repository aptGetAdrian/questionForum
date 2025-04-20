const Question = require('../models/questionsModel.js'); 
const marked = require('marked');
const Comment = require('../models/commentsModel.js');
const subComment = require('../models/subCommentModel.js');
var UserModel = require('../models/userModel.js');

module.exports = {
    
    list: async (req, res) => {
        try {
        const questions = await Question.find();
        res.render('questions/list', { questions });
        } catch (err) {
          const error2 = "500: Trouble fetching list";
          return res.render('error', { 
              error2,
              error: err
          });
        }
    },
    
    show: async (req, res, next) => {
        try {
          const question = await Question.findById(req.params.id)
            .populate('author', 'username profilePicture') // <-- populate author's username + profilePicture
            .lean();
      

          await Question.findByIdAndUpdate(req.params.id, {
              $inc: { views: 1 },
              $set: { lastActivity: new Date() }
          });

          const comments = await Comment.find({ question: req.params.id })
            .populate('author', 'username profilePicture')
            .populate({
                path: 'subComments',
                populate: { path: 'author', select: 'username profilePicture' }
            })
            .lean();
      
          if (!question) return res.status(404).send('Question not found');
      
          let isOwner = false;
          if (req.session.userId && question.author) {
            isOwner = req.session.userId.toString() === question.author._id.toString(); // changed .author to .author._id
          }
      
          // Safely pull question author's profile picture
          const questionAuthorProfilePicture = question.author?.profilePicture || '/images/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg'; 
      
          // Add isCommentOwner property and userVote to each comment
          const enhancedComments = comments.map(comment => {
            const isCommentOwner =
              req.session.userId &&
              comment.author &&
              comment.author._id.toString() === req.session.userId.toString();
      
            let userVote = 0; // Default: no vote
            if (req.session.userId && comment.voters) {
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
      
            // Safely pull profilePicture from populated author
            const profilePicture = comment.author?.profilePicture || '/images/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg';
      
            return { ...comment, isCommentOwner, userVote, isAccepted, profilePicture };
          });
      
          // Sort comments: accepted answer first, then by score (highest to lowest)
          const sortedComments = enhancedComments.sort((a, b) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            return (a.createdAt || 0) - (b.createdAt || 0);
          });
      
          res.render('questions/show', {
            question,
            isOwner,
            comments: sortedComments,
            session: req.session,
            questionAuthorProfilePicture // <-- pass to view
          });
      
        } catch (err) {
          const error2 = "500: Tbh i've no idea what the issue is";
                return res.render('error', { 
                    error2,
                    error: err
                });
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
            { ...req.body, isEdited: true }, 
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
        await Comment.deleteMany({ question: req.params.id })
        await subComment.deleteMany({ question: req.params.id })
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
            const error2 = "500: Server error";
            return res.render('error', { 
                error2,
                error: err
            });
          }
    },

    hotQuestions: async (req, res) => {
      try {
        const oneDayAgo = new Date(Date.now() - 24*60*60*1000);
        const hotQuestions = await Question.aggregate([ 
          { $match: { lastActivity: { $gte: oneDayAgo } } },
          { $lookup: {
              from: 'comments',
              let: { qId: '$_id' },
              pipeline: [
                { $match: {
                    $expr: { $eq: ['$question', '$$qId'] },
                    createdAt: { $gte: oneDayAgo }
                } }
              ],
              as: 'recentComments'
          }},
          { $addFields: {
              replies: { $size: '$recentComments' },
              score: { $add: ['$views', { $multiply: [2, { $size: '$recentComments' }] }] }
              // tu lahko α = 2 ali karkoli drugega
          }},
          { $sort: { score: -1 } },
          { $limit: 10 }  // prikažeš top 10
         ]);
        res.render('questions/hot', { hotQuestions });
      } catch (err) {
        const error2 = "500: Error creating profile";
                return res.render('error', { 
                    error2,
                    error: err
                });
      }

    }
};