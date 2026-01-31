// src/lib/cors.js - UPDATED
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Add your Vite frontend
  'http://127.0.0.1:5173'
];

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.join(', '),
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export default corsHeaders;