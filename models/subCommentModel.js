const mongoose = require('mongoose');

const subCommentsSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, 
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
});

module.exports = mongoose.model('subComment', subCommentsSchema);