// Imported first by helpers.js so these are set before config/env.js loads.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-0123456789abcdef";
process.env.STRIPE_SECRET_KEY = "";
process.env.MONGODB_URL = "";
process.env.MONGODB_URI = "";
process.env.CLIENT_URL = "http://localhost:4150";
