const express = require('express');
const { listCourses, getCourse, createCourse, updateCourse } = require('../controller/courseController');
const { listComments, addComment, streamComments, updateComment, deleteComment } = require('../controller/commentController');
const { auth } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', listCourses);
router.get('/:id', getCourse);
router.post(
  '/',
  auth(true),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  createCourse
);

router.put(
  '/:id',
  auth(true),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  updateCourse
);

// comments
router.get('/:courseId/comments', listComments);
router.post('/:courseId/comments', auth(true), addComment);
router.get('/:courseId/comments/stream', streamComments);
router.put('/:courseId/comments/:commentId', auth(true), updateComment);
router.delete('/:courseId/comments/:commentId', auth(true), deleteComment);

module.exports = router;


