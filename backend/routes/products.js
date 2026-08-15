const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Seeding helper disabled
const seedProducts = [];

// GET /products - fetch all products from MongoDB
router.get('/', async (req, res) => {
  try {

    let products = await Product.find().sort({ createdAt: -1 });
    console.log(products)
    // Format response to ensure ID maps correctly for frontend
    const formatted = products.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      gender: p.gender,
      price: p.price,
      originalPrice: p.originalPrice,
      costPrice: p.costPrice,
      discount: p.discount,
      badge: p.badge,
      stock: p.stock,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      image: p.image,
      description: p.description,
      tags: p.tags,
      inStock: p.inStock,
      isCustomizable: p.isCustomizable,
      customizationType: p.customizationType,
      customizationPrompt: p.customizationPrompt
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /products/:id - fetch single product from MongoDB
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const formatted = {
      id: product._id,
      name: product.name,
      category: product.category,
      gender: product.gender,
      price: product.price,
      originalPrice: product.originalPrice,
      costPrice: product.costPrice,
      discount: product.discount,
      badge: product.badge,
      stock: product.stock,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      image: product.image,
      description: product.description,
      tags: product.tags,
      inStock: product.inStock,
      isCustomizable: product.isCustomizable,
      customizationType: product.customizationType,
      customizationPrompt: product.customizationPrompt
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /products - add new product to MongoDB
router.post('/', async (req, res) => {
  try {
    const { name, category, gender, price, originalPrice, costPrice, discount, badge, stock, image, description, tags, isCustomizable, customizationType, customizationPrompt } = req.body;
    const newProduct = await Product.create({
      name, category, gender, price, originalPrice, costPrice, discount, badge, stock, image, description, tags, inStock: true,
      isCustomizable, customizationType, customizationPrompt
    });
    const formatted = {
      id: newProduct._id,
      name: newProduct.name,
      category: newProduct.category,
      gender: newProduct.gender,
      price: newProduct.price,
      originalPrice: newProduct.originalPrice,
      costPrice: newProduct.costPrice,
      discount: newProduct.discount,
      badge: newProduct.badge,
      stock: newProduct.stock,
      rating: newProduct.rating,
      reviewsCount: newProduct.reviewsCount,
      image: newProduct.image,
      description: newProduct.description,
      tags: newProduct.tags,
      inStock: newProduct.inStock,
      isCustomizable: newProduct.isCustomizable,
      customizationType: newProduct.customizationType,
      customizationPrompt: newProduct.customizationPrompt
    };
    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /products/:id - toggle stock status or update details
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const formatted = {
      id: updated._id,
      name: updated.name,
      category: updated.category,
      gender: updated.gender,
      price: updated.price,
      originalPrice: updated.originalPrice,
      costPrice: updated.costPrice,
      discount: updated.discount,
      badge: updated.badge,
      stock: updated.stock,
      rating: updated.rating,
      reviewsCount: updated.reviewsCount,
      image: updated.image,
      description: updated.description,
      tags: updated.tags,
      inStock: updated.inStock,
      isCustomizable: updated.isCustomizable,
      customizationType: updated.customizationType,
      customizationPrompt: updated.customizationPrompt
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /products/:id - delete product from MongoDB
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product successfully deleted from MongoDB' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
