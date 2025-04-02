const mongoose = require('mongoose');

const commentsSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, 
    score: { type: Number, default: 0 }
});

module.exports = mongoose.model('Comment', commentsSchema);