const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed'],
      default: 'neutral',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);


