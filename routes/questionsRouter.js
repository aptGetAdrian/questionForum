const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController');

function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

// GET all questions
router.get('/list', questionsController.list);

// GET form to create new question
router.get('/new', requiresLogin, questionsController.showCreateForm);

// GET specific question
router.get('/:id', questionsController.show);

// POST create new question
router.post('/', requiresLogin, questionsController.create);

// GET edit form for question
router.get('/:id/edit', questionsController.showEditForm);

// PUT update question
router.put('/:id', requiresLogin, questionsController.update);

// DELETE question
router.delete('/:id', requiresLogin, questionsController.remove);

router.put('/:questionId/accept/:answerId', requiresLogin, questionsController.acceptAnswer);

module.exports = router;