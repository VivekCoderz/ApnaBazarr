# 🛍️ Dhagaro

**Home textiles straight from Panipat factories to your door.** Dhagaro is my ecommerce startup: customers order directly, products ship from partner factories, and no stock is held.

🔗 **Live:** [dhagaro.vercel.app](https://dhagaro.vercel.app) · [Instagram](https://www.instagram.com/dhagaro.in/) · [Facebook](https://www.facebook.com/dhagaro) · [LinkedIn](https://www.linkedin.com/company/dhagaro/)

🏛️ **MSME (Udyam) registered** micro enterprise: `UDYAM-HR-14-0100594` · Panipat, Haryana · in business since August 2026

## Features

- Product catalogue with categories, colour variants and reviews
- Checkout with **Razorpay** online payments and **Cash on Delivery**
- **Reseller and seller sign-up**, so others can sell Dhagaro products
- Customer feedback, order tracking and an analytics view for the team
- Image uploads to Cloudinary
- Google Shopping product feed
- Security: Helmet headers, rate-limited COD checks, payment verification and sign-up limits

## Tech stack

| Part | Tech |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt |
| Payments & media | Razorpay, Cloudinary (Multer) |
| Hosting | Vercel (storefront), Render (API) |

## Project structure

```
backend/    Express API: auth, products, orders, reseller, reviews, feedback, analytics, uploads
frontend/   React + Vite storefront
```

## Run locally

```bash
# API
cd backend
cp .env.example .env   # fill in MongoDB, JWT, Razorpay and Cloudinary values
npm install
npm start              # API on http://localhost:5000

# Storefront
cd ../frontend
npm install
npm run dev            # http://localhost:5173, calls the API at http://localhost:5000
```

Set `VITE_API_URL` in `frontend/.env` to point the storefront at a different API.

## About

Built and run by [Vivek Garg](https://vivekgarg.vercel.app), B.Tech CSE student at Geeta University, Panipat.
