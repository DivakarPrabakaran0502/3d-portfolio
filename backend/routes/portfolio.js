const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Portfolio = require('../models/portfolio');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['Web Development', '3D Design', 'Mobile App', 'UI/UX', 'Data Science', 'Game Dev', 'Other'];
const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

// GET /api/portfolio
router.get('/', authMiddleware, (req, res) => {
  const items = Portfolio.findByUser(req.user.id);
  res.json(items.reverse()); // newest first
});

// POST /api/portfolio
router.post('/', authMiddleware, (req, res) => {
  const { title, description, category, tags, liveUrl, githubUrl, color, shape } = req.body;

  if (!title || !description)
    return res.status(400).json({ error: 'Title and description are required.' });

  const item = Portfolio.create({
    id: uuidv4(),
    userId: req.user.id,
    title: title.trim(),
    description: description.trim(),
    category: CATEGORIES.includes(category) ? category : 'Web Development',
    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    liveUrl: liveUrl || '',
    githubUrl: githubUrl || '',
    color: COLORS.includes(color) ? color : '#6366f1',
    shape: shape || 'torus',
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json(item);
});

// PUT /api/portfolio/:id
router.put('/:id', authMiddleware, (req, res) => {
  const item = Portfolio.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  if (item.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

  // Increment view count separately
  const { title, description, category, tags, liveUrl, githubUrl, color, shape } = req.body;
  const updated = Portfolio.update(req.params.id, { title, description, category, tags, liveUrl, githubUrl, color, shape });
  res.json(updated);
});

// PATCH /api/portfolio/:id/view — increment view count
router.patch('/:id/view', (req, res) => {
  const item = Portfolio.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found.' });
  const updated = Portfolio.update(req.params.id, { views: (item.views || 0) + 1 });
  res.json(updated);
});

// DELETE /api/portfolio/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const item = Portfolio.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  if (item.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

  Portfolio.remove(req.params.id);
  res.json({ message: 'Deleted successfully.' });
});

module.exports = router;
