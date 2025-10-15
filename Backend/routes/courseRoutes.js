const express = require('express');
const { listCourses, getCourse, createCourse, updateCourse } = require('../controller/courseController');
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

module.exports = router;


