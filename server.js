#!/usr/bin/env node

/* ============================================================
   منصة وعي الشباب BBA - Security Headers Server
   Zero-dependency Node.js HTTP/1.1 server that serves the
   static site with all required security headers.

   Usage:
     node server.js          # serves on port 3000
     PORT=8080 node server.js  # custom port
   ============================================================ */

const http = require('http');
const fs   = require('fs');
const path = require('path');

/* ---- Configuration ---- */
const PORT   = parseInt(process.env.PORT, 10) || 3000;
const ROOT   = __dirname;       /* serve files from the project root */
const INDEX  = 'index.html';    /* fallback for directory requests */

/* ---- MIME types ---- */
const MIME_TYPES = {
  '.html' : 'text/html; charset=utf-8',
  '.css'  : 'text/css; charset=utf-8',
  '.js'   : 'application/javascript; charset=utf-8',
  '.json' : 'application/json; charset=utf-8',
  '.svg'  : 'image/svg+xml',
  '.png'  : 'image/png',
  '.ico'  : 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

/* ---- Content-Security-Policy ---- */
/* Built from all external resources used across the site */
const CSP = [
  "default-src 'self'",

  /* Scripts: CDN libraries + inline scripts + eval for Chart.js */
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    + " https://cdn.jsdelivr.net"
    + " https://cdnjs.cloudflare.com",

  /* Styles: CDN + Google Fonts CSS + inline styles + inline style blocks */
  "style-src 'self' 'unsafe-inline'"
    + " https://cdnjs.cloudflare.com"
    + " https://fonts.googleapis.com",

  /* Fonts: Google Font files */
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",

  /* Images: Unsplash for articles + data: URIs for QR codes/inline SVGs */
  "img-src 'self' data: https://images.unsplash.com https://*.unsplash.com",

  /* Connections: Supabase REST + Realtime (WebSocket) */
  "connect-src 'self'"
    + " https://ouyqcyrbppkxvcknxtbn.supabase.co"
    + " wss://ouyqcyrbppkxvcknxtbn.supabase.co",

  /* Prevent loading frames/plugins from external */
  "frame-src 'none'",
  "object-src 'none'",

  /* Frame ancestors: deny clickjacking */
  "frame-ancestors 'none'",

  /* Forms: same origin only */
  "form-action 'self'",

  /* Base URI + manifest: same origin only */
  "base-uri 'self'",
  "manifest-src 'self'",
].join('; ');

/* ---- Security Headers (applied to every response) ---- */
const SECURITY_HEADERS = {
  'Content-Security-Policy':   CSP,
  'X-Frame-Options':          'DENY',
  'X-Content-Type-Options':   'nosniff',
  'Referrer-Policy':          'strict-origin-when-cross-origin',
  'Permissions-Policy':       'camera=(), microphone=(), geolocation=(), interest-cohort=()',

  /* Additional hardening */
  'X-DNS-Prefetch-Control':   'off',
  'Strict-Transport-Security':'max-age=63072000; includeSubDomains; preload',
};

/* ---- Helpers ---- */

/** Safely resolve a file path inside the ROOT directory (prevents traversal) */
function safePath(raw) {
  var decoded = decodeURIComponent(raw);
  var resolved = path.resolve(ROOT, '.' + decoded);  /* prepend '.' for relative */
  /* Ensure the resolved path stays inside ROOT */
  if (resolved.indexOf(ROOT) !== 0) return null;
  return resolved;
}

/** Determine Content-Type by extension */
function getContentType(filePath) {
  var ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/* ---- Server ---- */
var server = http.createServer(function onRequest(req, res) {
  /* ---- Apply security headers to every response ---- */
  Object.keys(SECURITY_HEADERS).forEach(function (key) {
    res.setHeader(key, SECURITY_HEADERS[key]);
  });

  /* ---- Parse the request URL ---- */
  var requestPath = req.url.split('?')[0].split('#')[0];
  if (requestPath.charAt(requestPath.length - 1) === '/') {
    requestPath += INDEX;
  }
  if (requestPath === '') {
    requestPath = '/' + INDEX;
  }

  var filePath = safePath(requestPath);
  if (!filePath) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  /* ---- Serve the file ---- */
  fs.readFile(filePath, function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        /* Try index.html for SPA-style routing (client-side hash) */
        var indexFilePath = safePath('/' + INDEX);
        if (indexFilePath) {
          fs.readFile(indexFilePath, function (err2, data2) {
            if (err2) {
              sendError(res, 404, 'Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(data2);
            }
          });
        } else {
          sendError(res, 404, 'Not Found');
        }
      } else {
        sendError(res, 500, 'Internal Server Error');
      }
      return;
    }

    var contentType = getContentType(filePath);

    /* For HTML responses, inject CSP meta tag as a fallback for CDN hosting */
    if (contentType.indexOf('text/html') === 0) {
      var injectCSP = true;
      if (injectCSP) {
        /* CSP meta tag is already in the HTML, but we send the header too */
      }
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

/* ---- Error helper ---- */
function sendError(res, statusCode, message) {
  var body = '<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>' + statusCode + ' ' + message + '</title>'
    + '<style>body{font-family:sans-serif;background:#06090e;color:#D4AF37;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}'
    + 'h1{font-size:3rem;margin-bottom:0.5rem}p{color:#94a3b8}</style></head>'
    + '<body><div><h1>' + statusCode + '</h1><p>' + message + '</p></div></body></html>';
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

/* ---- Start ---- */
server.listen(PORT, function () {
  console.log('');
  console.log('  \u001b[33m\u2611\u001b[0m \u001b[1m\u0645\u0646\u0635\u0629 \u0648\u0639\u064a \u0627\u0644\u0634\u0628\u0627\u0628 BBA\u001b[0m');
  console.log('  \u001b[90m\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u001b[0m');
  console.log('  \u001b[36m\u273f\u001b[0m  \u0633\u0631\u0648\u0631 \u0628\u0627\u0644\u0628\u0648\u0627\u0628\u0629  \u001b[1m' + PORT + '\u001b[0m');
  console.log('  \u001b[36m\u273f\u001b[0m  \u0627\u0641\u062a\u062d    \u001b[4mhttp://localhost:' + PORT + '/\u001b[0m');
  console.log('');
  console.log('  \u001b[90m\u2622 \u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u062c\u0645\u064a\u0639 \u0631\u0624\u0648\u0633 \u0627\u0644\u0623\u0645\u0627\u0646:\u001b[0m');
  console.log('  \u001b[32m  \u2713\u001b[0m Content-Security-Policy');
  console.log('  \u001b[32m  \u2713\u001b[0m X-Frame-Options (\u0645\u0646\u0639 \u0627\u0644\u0627\u062D\u062A\u0648\u0627\u0621)');
  console.log('  \u001b[32m  \u2713\u001b[0m X-Content-Type-Options');
  console.log('  \u001b[32m  \u2713\u001b[0m Referrer-Policy');
  console.log('  \u001b[32m  \u2713\u001b[0m Permissions-Policy');
  console.log('  \u001b[32m  \u2713\u001b[0m Strict-Transport-Security');
  console.log('  \u001b[32m  \u2713\u001b[0m X-DNS-Prefetch-Control');
  console.log('');
});
