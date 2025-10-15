const { Readable } = require('stream');
const { cloudinary } = require('../config/cloudinary');
const Course = require('../models/Course');

async function uploadBufferToCloudinary(buffer, folder, resource_type = 'auto') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

async function listCourses(_req, res) {
  const courses = await Course.find({}).sort({ createdAt: -1 });
  return res.json({ courses });
}

async function getCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  return res.json({ course });
}

async function createCourse(req, res) {
  try {
    const { title, description, duration, difficulty, categories, thumbnailUrl, videoUrl } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'title and description are required' });

    const categoriesArray = (categories || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    // Handle optional uploads
    let finalThumbnailUrl = thumbnailUrl || '';
    let thumbnailPublicId;
    if (req.files?.thumbnail?.[0]) {
      const file = req.files.thumbnail[0];
      console.log('Thumbnail file received:', { fieldname: file.fieldname, size: file.size, mimetype: file.mimetype });
      const buf = file.buffer;
      if ((!buf || !buf.length) && !thumbnailUrl) {
        console.error('Thumbnail file buffer empty');
        // If empty file and no URL provided, treat as no thumbnail instead of hard error
        // Continue without thumbnail upload
      }
      try {
        if (buf && buf.length) {
          const result = await uploadBufferToCloudinary(
            buf,
            'elearning/thumbnails',
            'image'
          );
          finalThumbnailUrl = result.secure_url;
          thumbnailPublicId = result.public_id;
        }
      } catch (e) {
        console.error('Thumbnail upload failed:', e);
        throw e;
      }
    }

    let finalVideoUrl = videoUrl || '';
    let videoPublicId;
    if (req.files?.video?.[0]) {
      const file = req.files.video[0];
      console.log('Video file received:', { fieldname: file.fieldname, size: file.size, mimetype: file.mimetype });
      const buf = file.buffer;
      if ((!buf || !buf.length) && !videoUrl) {
        console.error('Video file buffer empty');
        // If empty file and no URL provided, treat as no video instead of hard error
        // Continue without video upload
      }
      try {
        if (buf && buf.length) {
          const result = await uploadBufferToCloudinary(
            buf,
            'elearning/videos',
            'video'
          );
          finalVideoUrl = result.secure_url;
          videoPublicId = result.public_id;
        }
      } catch (e) {
        console.error('Video upload failed:', e);
        throw e;
      }
    }

    const course = await Course.create({
      title,
      description,
      duration,
      difficulty,
      categories: categoriesArray,
      thumbnailUrl: finalThumbnailUrl,
      videoUrl: finalVideoUrl,
      thumbnailPublicId,
      videoPublicId,
      instructorId: req.user?.id,
      instructorName: req.user?.email || 'Unknown',
    });

    return res.status(201).json({ course });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ message: 'Failed to create course', error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
}

module.exports = { listCourses, getCourse, createCourse };
async function destroyCloudinary(publicId, resource_type = 'image') {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type });
  } catch (e) {
    // non-fatal
    console.error('Cloudinary destroy failed:', e?.message || e);
  }
}

async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!req.user || course.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, description, duration, difficulty, categories, thumbnailUrl, videoUrl } = req.body;
    const categoriesArray = (categories || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    // Start with existing values
    let finalThumbnailUrl = typeof thumbnailUrl === 'string' ? thumbnailUrl : course.thumbnailUrl;
    let thumbnailPublicId = course.thumbnailPublicId;
    let finalVideoUrl = typeof videoUrl === 'string' ? videoUrl : course.videoUrl;
    let videoPublicId = course.videoPublicId;

    // If a new thumbnail file is sent, upload and replace
    if (req.files?.thumbnail?.[0]) {
      const f = req.files.thumbnail[0];
      if (f.buffer && f.buffer.length) {
        const result = await uploadBufferToCloudinary(f.buffer, 'elearning/thumbnails', 'image');
        // delete old if exists
        if (thumbnailPublicId) await destroyCloudinary(thumbnailPublicId, 'image');
        finalThumbnailUrl = result.secure_url;
        thumbnailPublicId = result.public_id;
      }
    }

    // If a new video file is sent, upload and replace
    if (req.files?.video?.[0]) {
      const f = req.files.video[0];
      if (f.buffer && f.buffer.length) {
        const result = await uploadBufferToCloudinary(f.buffer, 'elearning/videos', 'video');
        if (videoPublicId) await destroyCloudinary(videoPublicId, 'video');
        finalVideoUrl = result.secure_url;
        videoPublicId = result.public_id;
      }
    }

    course.title = title ?? course.title;
    course.description = description ?? course.description;
    course.duration = duration ?? course.duration;
    course.difficulty = difficulty ?? course.difficulty;
    course.categories = categories ? categoriesArray : course.categories;
    course.thumbnailUrl = finalThumbnailUrl;
    course.thumbnailPublicId = thumbnailPublicId;
    course.videoUrl = finalVideoUrl;
    course.videoPublicId = videoPublicId;

    await course.save();
    return res.json({ course });
  } catch (err) {
    console.error('Update course error:', err);
    return res.status(500).json({ message: 'Failed to update course', error: err.message });
  }
}

module.exports.updateCourse = updateCourse;


