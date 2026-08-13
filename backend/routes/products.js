const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Seeding helper to load initial real products if DB is empty
const seedProducts = [
  {
    name: "Pure Premium Cotton Kurta Set",
    category: "Rakhi Specials",
    gender: "Men",
    price: 1299.00,
    originalPrice: 1999.00,
    discount: "35% OFF",
    badge: "BESTSELLER",
    stock: 50,
    rating: 5,
    reviewsCount: 14,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    description: "Elegant pure premium cotton silk blend kurta set with detailed embroidery. Perfect for festive celebrations, weddings, and traditional gatherings.",
    tags: ["New Arrival", "Best Selling", "Featured"],
    inStock: true
  },
  {
    name: "Luxury Silk Banarasi Saree",
    category: "Women's Wear",
    gender: "Women",
    price: 2499.00,
    originalPrice: 3999.00,
    discount: "37% OFF",
    badge: "ELEGANT",
    stock: 25,
    rating: 5,
    reviewsCount: 22,
    image: "https://images.unsplash.com/photo-1610030470211-13f5dd72a8c3?auto=format&fit=crop&w=600&q=80",
    description: "Premium banarasi silk saree woven with golden zari borders. Comes with a matching unstitched blouse piece.",
    tags: ["Top Rated", "Featured"],
    inStock: true
  },
  {
    name: "Classic Brown Leather Casual Boots",
    category: "Footwear & Shoes",
    gender: "Men",
    price: 1899.00,
    originalPrice: 2799.00,
    discount: "32% OFF",
    badge: "NEW ARRIVAL",
    stock: 35,
    rating: 5,
    reviewsCount: 12,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    description: "Comfortable brown mid-top casual leather boots with heavy-duty slip-resistant rubber outsoles and memory foam insoles.",
    tags: ["New Arrival", "Best Selling"],
    inStock: true
  }
];

// GET /products - fetch all products from MongoDB
router.get('/', async (req, res) => {
  try {
    let products = await Product.find().sort({ createdAt: -1 });
    
    // Seed DB if completely empty
    if (products.length === 0) {
      await Product.insertMany(seedProducts);
      products = await Product.find().sort({ createdAt: -1 });
    }
    
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
      inStock: p.inStock
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
      inStock: product.inStock
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /products - add new product to MongoDB
router.post('/', async (req, res) => {
  try {
    const { name, category, gender, price, originalPrice, costPrice, discount, badge, stock, image, description, tags } = req.body;
    const newProduct = await Product.create({
      name, category, gender, price, originalPrice, costPrice, discount, badge, stock, image, description, tags, inStock: true
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
      inStock: newProduct.inStock
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
      inStock: updated.inStock
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
