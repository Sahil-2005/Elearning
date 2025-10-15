const Comment = require('../models/Comment');
const axios = require('axios');

// In-memory SSE subscribers by courseId
const courseSubscribers = new Map(); // courseId -> Set(res)

// --- Helper function for Azure Sentiment Analysis ---
async function getSentiment(text) {
  // Return default if keys or endpoint are not set in environment variables
  if (!process.env.COG_KEY || !process.env.COG_ENDPOINT) {
    console.log('Azure AI credentials not configured. Skipping sentiment analysis.');
    return 'neutral';
  }

  try {
    // Robustly format the endpoint URL to ensure it has a trailing slash
    const sentimentUrl = `${(process.env.COG_ENDPOINT).replace(/\/?$/, '/')}text/analytics/v3.1/sentiment`;
    const documents = { documents: [{ id: '1', language: 'en', text }] };
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.COG_KEY,
      'Content-Type': 'application/json',
    };
    
    const response = await axios.post(sentimentUrl, documents, { headers });

    if (response.data?.documents?.length) {
      return response.data.documents[0].sentiment; // Return the detected sentiment
    }
  } catch (apiError) {
    console.error('Azure AI service call failed:', apiError.message);
  }

  return 'neutral'; // Return default sentiment on failure
}

function sendEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getSubscribers(courseId) {
  let set = courseSubscribers.get(courseId);
  if (!set) {
    set = new Set();
    courseSubscribers.set(courseId, set);
  }
  return set;
}

async function listComments(req, res) {
  const { courseId } = req.params;
  const comments = await Comment.find({ courseId }).sort({ createdAt: -1 });
  return res.json({ comments });
}

async function addComment(req, res) {
  try {
    const { courseId } = req.params;
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!content) return res.status(400).json({ message: 'content is required' });

    // **Call the reusable helper function to get sentiment**
    const sentimentResult = await getSentiment(content);

    const comment = await Comment.create({
      courseId,
      userId: req.user.id,
      userName: req.user.email,
      content,
      sentiment: sentimentResult,
    });
    
    // Broadcast to SSE subscribers
    const subs = getSubscribers(courseId);
    subs.forEach((client) => {
      try { sendEvent(client, { type: 'comment', action: 'created', comment }); } catch (_) {}
    });

    return res.status(201).json({ comment });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
}

function streamComments(req, res) {
  const { courseId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const subs = getSubscribers(courseId);
  subs.add(res);

  req.on('close', () => {
    subs.delete(res);
  });
}

async function updateComment(req, res) {
  try {
    const { courseId, commentId } = req.params;
    const { content } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const comment = await Comment.findById(commentId);
    if (!comment || comment.courseId.toString() !== courseId) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (!content) return res.status(400).json({ message: 'content is required' });
    
    comment.content = content;
    // **Call the reusable helper function again on update**
    comment.sentiment = await getSentiment(content);
    
    await comment.save();
    
    const subs = getSubscribers(courseId);
    subs.forEach((client) => {
      try { sendEvent(client, { type: 'comment', action: 'updated', comment }); } catch (_) {}
    });
    return res.json({ comment });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update comment', error: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    const { courseId, commentId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const comment = await Comment.findById(commentId);
    if (!comment || comment.courseId.toString() !== courseId) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    
    await comment.deleteOne();
    
    const subs = getSubscribers(courseId);
    subs.forEach((client) => {
      try { sendEvent(client, { type: 'comment', action: 'deleted', commentId }); } catch (_) {}
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete comment', error: err.message });
  }
}

module.exports = { listComments, addComment, streamComments, updateComment, deleteComment };