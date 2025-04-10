const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');

function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

//router.get('/list', commentsController.list);
//
//// GET form to create new question
//router.get('/new', requiresLogin, commentsController.showCreateForm);
//

//POST create new comment
router.post('/:id', requiresLogin, commentsController.create);

//POST score
router.post('/:id/downvote/:id3', requiresLogin, commentsController.downvote);
router.post('/:id/upvote/:id3', requiresLogin, commentsController.upvote);

//POST create new comment
router.delete('/:id', requiresLogin, commentsController.deleteIndividual);

//
//// GET edit form for question
//router.get('/:id/edit', commentsController.showEditForm);
//
//// PUT update question
//router.put('/:id', requiresLogin, commentsController.update);
//
//// DELETE question
//router.delete('/:id', requiresLogin, commentsController.remove);

module.exports = router;