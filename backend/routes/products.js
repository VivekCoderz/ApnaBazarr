const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const { shippingPreview } = require('../utils/shipping');

// Products hidden by the admin have isActive: false. Products saved before the
// field existed have no value and count as active.
const ACTIVE_FILTER = { isActive: { $ne: false } };

// Average of real reviews, or null when there are none (never show a fake 5 stars)
const averageRating = (reviews) => reviews.length > 0
  ? Number((reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1))
  : null;

// True when the request carries a valid admin token. Used so the admin panel can
// still see (and un-hide) hidden products; never blocks the public request.
async function isAdminRequest(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.admin) return true;
    const user = await User.findById(decoded.id).select('role');
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

// GET /products - fetch all products from MongoDB
router.get('/', async (req, res) => {
  try {
    // ?includeHidden=1 is honoured for admins only (admin panel needs hidden products to un-hide them)
    const showHidden = req.query.includeHidden === '1' && await isAdminRequest(req);
    let products = await Product.find(showHidden ? {} : ACTIVE_FILTER).populate('seller', 'name email sellerProfile').sort({ createdAt: -1 });
    
    // Filter out products from rejected/suspended sellers
    const approvedProducts = products.filter(p => {
      if (!p.seller) return true; // General store products
      return p.seller.sellerProfile?.status !== 'rejected';
    });

    const allReviews = await Review.find();
    const allOrders = await Order.find();

    const salesMap = {};
    allOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const pId = String(item.productId);
          salesMap[pId] = (salesMap[pId] || 0) + (item.quantity || 1);
        });
      }
    });

    // Format response to ensure ID maps correctly for frontend
    // Public response: never include costPrice/margin, only the derived delivery hint
    const formatted = approvedProducts.map(p => {
      const prodReviews = allReviews.filter(r => String(r.productId) === String(p._id));
      const reviewsCount = prodReviews.length;
      const rating = averageRating(prodReviews);

      return {
        id: p._id,
        name: p.name,
        category: p.category,
        gender: p.gender,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        badge: p.badge,
        stock: p.stock,
        rating,
        reviewsCount,
        salesCount: salesMap[String(p._id)] || 0,
        image: p.image,
        description: p.description,
        tags: p.tags,
        sizes: p.sizes,
        colors: p.colors,
        images: p.images && p.images.length > 0 ? p.images : [p.image],
        inStock: p.inStock,
        isActive: p.isActive !== false,
        isCustomizable: p.isCustomizable,
        customizationType: p.customizationType,
        customizationPrompt: p.customizationPrompt,
        shipping: shippingPreview(p),
        seller: p.seller ? {
          id: p.seller._id,
          name: p.seller.name,
          shopName: p.seller.sellerProfile?.shopName || p.seller.name,
          shopDescription: p.seller.sellerProfile?.shopDescription || '',
          shopAddress: p.seller.sellerProfile?.shopAddress || '',
          phone: p.seller.sellerProfile?.phone || '',
          isOpen: p.seller.sellerProfile?.isOpen ?? true,
          shopBanner: p.seller.sellerProfile?.shopBanner || '',
          status: p.seller.sellerProfile?.status || 'approved'
        } : null
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /products/seller/my-products - fetch products belonging to authenticated seller
router.get('/seller/my-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only sellers and admins can access.' });
    }
    
    // Admins see all, sellers see their own
    const query = req.user.role === 'admin' ? {} : { seller: req.user._id };
    const products = await Product.find(query).sort({ createdAt: -1 });
    
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
      sizes: p.sizes,
      colors: p.colors,
      images: p.images && p.images.length > 0 ? p.images : [p.image],
      inStock: p.inStock,
      isActive: p.isActive !== false,
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
    const product = await Product.findById(req.params.id).populate('seller', 'name email sellerProfile');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.isActive === false && !(await isAdminRequest(req))) {
      return res.status(404).json({ success: false, message: 'This product is not available right now.' });
    }
    const prodReviews = await Review.find({ productId: String(product._id) });
    const reviewsCount = prodReviews.length;
    const rating = averageRating(prodReviews);

    const allItemOrders = await Order.find({ "items.productId": String(product._id) });
    let salesCount = 0;
    allItemOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (String(item.productId) === String(product._id)) {
            salesCount += (item.quantity || 1);
          }
        });
      }
    });

    // Public response: never include costPrice/margin, only the derived delivery hint
    const formatted = {
      id: product._id,
      name: product.name,
      category: product.category,
      gender: product.gender,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      badge: product.badge,
      stock: product.stock,
      rating,
      reviewsCount,
      salesCount,
      image: product.image,
      description: product.description,
      tags: product.tags,
      sizes: product.sizes,
      colors: product.colors,
      images: product.images && product.images.length > 0 ? product.images : [product.image],
      inStock: product.inStock,
      isActive: product.isActive !== false,
      isCustomizable: product.isCustomizable,
      customizationType: product.customizationType,
      customizationPrompt: product.customizationPrompt,
      shipping: shippingPreview(product),
      seller: product.seller ? {
        id: product.seller._id,
        name: product.seller.name,
        shopName: product.seller.sellerProfile?.shopName || product.seller.name,
        shopDescription: product.seller.sellerProfile?.shopDescription || '',
        shopAddress: product.seller.sellerProfile?.shopAddress || '',
        phone: product.seller.sellerProfile?.phone || ''
      } : null
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /products - add new product to MongoDB
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only sellers and admins can add products.' });
    }
    const { name, category, gender, price, originalPrice, costPrice, discount, badge, stock, image, description, tags, isCustomizable, customizationType, customizationPrompt, sizes, colors, images, isActive } = req.body;
    const newProduct = await Product.create({
      name, category, gender, price, originalPrice, costPrice, discount, badge, stock, image, description, tags, inStock: true,
      isActive: isActive !== false,
      isCustomizable, customizationType, customizationPrompt, sizes, colors, images,
      seller: req.user.role === 'seller' ? req.user._id : undefined
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
      sizes: newProduct.sizes,
      colors: newProduct.colors,
      images: newProduct.images && newProduct.images.length > 0 ? newProduct.images : [newProduct.image],
      inStock: newProduct.inStock,
      isActive: newProduct.isActive !== false,
      isCustomizable: newProduct.isCustomizable,
      customizationType: newProduct.customizationType,
      customizationPrompt: newProduct.customizationPrompt,
      shipping: shippingPreview(newProduct)
    };
    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /products/:id - toggle stock status or update details
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Check permission: only admin or product owner (seller)
    if (req.user.role !== 'admin' && String(product.seller) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this product.' });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
      sizes: updated.sizes,
      colors: updated.colors,
      images: updated.images && updated.images.length > 0 ? updated.images : [updated.image],
      inStock: updated.inStock,
      isActive: updated.isActive !== false,
      isCustomizable: updated.isCustomizable,
      customizationType: updated.customizationType,
      customizationPrompt: updated.customizationPrompt,
      shipping: shippingPreview(updated)
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /products/:id - delete product from MongoDB
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Check permission: only admin or product owner (seller)
    if (req.user.role !== 'admin' && String(product.seller) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this product.' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product successfully deleted from MongoDB' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
