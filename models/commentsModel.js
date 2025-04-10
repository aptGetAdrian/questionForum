const mongoose = require('mongoose');

const commentsSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, 
    score: { type: Number, default: 0 },
    isAccepted: { type: Boolean, default: false },
    voters: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          vote: { type: Number, enum: [-1, 0, 1], default: 0 }
        }
      ],
    isEdited: { type: Boolean, default: false }
});

module.exports = mongoose.model('Comment', commentsSchema);