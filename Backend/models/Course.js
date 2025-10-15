const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    duration: { type: String, default: '' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    categories: { type: [String], default: [] },
    thumbnailUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    instructorName: { type: String, required: true },
    thumbnailPublicId: { type: String },
    videoPublicId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', CourseSchema);


