const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }
});


module.exports = mongoose.model('Question', questionSchema);