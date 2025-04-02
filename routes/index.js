var express = require('express');
var router = express.Router();
const Question = require('../models/questionsModel'); // Import your Question model

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const recentQuestions = await Question.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username email') // Populate with username
      .exec();
    
    res.render('index', { 
      title: 'Home',
      recentQuestions: recentQuestions
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;