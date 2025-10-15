const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'du7nltmm8',
  api_key: process.env.CLOUDINARY_API_KEY || '887252769828467',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Yc41Sf8tmK7D4IdklJYsjPn3D0k',
});

module.exports = { cloudinary };


