# Security 🔒

This document details the security measures implemented in the Antminer Dashboard application.

## 🛡️ Implemented Security Measures

### 1. HTTP Digest Authentication

The application uses **Digest** authentication (RFC 2617) to communicate with the Antminer:

- ✅ Password is **never** sent in clear text
- ✅ Uses MD5 hashing with nonce, cnonce, and counter
- ✅ Protection against replay attacks
- ✅ More secure than Basic authentication

**Implementation**: `lib/digest-auth.ts`

### 2. Secure Environment Variables

All sensitive credentials are stored in environment variables:

```env
ANTMINER_HOST=http://192.168.1.100
ANTMINER_USERNAME=root
ANTMINER_PASSWORD=your_password
API_SECRET_KEY=generated_secret_key
```

- ✅ `.env` is in `.gitignore` (never committed)
- ✅ Separation of secrets from code
- ✅ Different secrets per environment (dev/prod)

### 3. Secure Architecture

#### Server-side API only

Antminer API calls are made **exclusively** server-side via tRPC:

```
Client (Browser) → tRPC → Server API → Antminer
```

- ✅ No credentials exposed to the client
- ✅ Cannot inspect authentication headers
- ✅ Authentication code only runs on the server

#### HTTP Security Headers

The Next.js middleware (`middleware.ts`) adds security headers:

```typescript
// Security headers implemented
X-Frame-Options: SAMEORIGIN                    // Clickjacking protection
X-Content-Type-Options: nosniff                // MIME sniffing protection
X-XSS-Protection: 1; mode=block                // XSS protection
Strict-Transport-Security: max-age=63072000    // Force HTTPS
Content-Security-Policy: ...                   // Strict CSP
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: ...                        // Disable unnecessary APIs
```

### 4. Type Safety with TypeScript

- ✅ All files are typed with TypeScript
- ✅ Data validation with Zod
- ✅ tRPC provides end-to-end type safety
- ✅ Reduction of runtime errors

### 5. Up-to-date Dependencies

The project uses the latest stable versions:

- Next.js 15+
- React 19
- tRPC 11+
- Bun (modern and secure runtime)

## 🚨 Production Recommendations

### 1. HTTPS Required

**⚠️ IMPORTANT**: In production, **ALWAYS** use HTTPS.

#### Option A: Reverse Proxy (recommended)

Use Nginx or Caddy as a reverse proxy:

**Nginx example:**

```nginx
server {
    listen 443 ssl http2;
    server_name antminer.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Caddy example (even simpler):**

```caddy
antminer.yourdomain.com {
    reverse_proxy localhost:3000
}
```

#### Option B: Vercel / Cloud Provider

Deploy on Vercel, Netlify, or another provider that handles HTTPS automatically.

### 2. Generate Strong Secret Key

Generate a cryptographically secure secret key:

```bash
openssl rand -base64 32
```

Add it to `.env`:

```env
API_SECRET_KEY=your_generated_key_here
```

### 3. Network Access Restriction

#### Firewall

Limit access to the application:

```bash
# UFW example (Ubuntu)
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw deny 3000
```

#### VPN

For external access, use a VPN (WireGuard, OpenVPN, Tailscale) rather than exposing the app publicly.

### 4. Monitoring and Logs

Enable logs to monitor access:

```typescript
// In server/routers/antminer.ts
console.log('[SECURITY] API access:', {
  timestamp: new Date().toISOString(),
  endpoint: 'getSystemInfo',
  // Add context to get IP
});
```

### 5. Rate Limiting

Add a rate limiter to prevent abuse:

```bash
bun add @upstash/ratelimit @upstash/redis
```

Or use a reverse proxy with rate limiting (Nginx, Caddy).

### 6. User Authentication (optional)

If you want to protect dashboard access, add authentication:

- **NextAuth.js**: Complete solution
- **Basic authentication**: Simple and effective
- **Tailscale**: Network authentication

## 🔍 Security Audit

### Pre-deployment checklist

- [ ] `.env` contains real credentials (not examples)
- [ ] `API_SECRET_KEY` is a strong random key
- [ ] `.env` is in `.gitignore`
- [ ] HTTPS is configured (production)
- [ ] Security headers are active
- [ ] Firewall is configured
- [ ] Dependencies are up to date
- [ ] Logs are enabled

### Security tests

```bash
# Test security headers
curl -I https://yourdomain.com

# Scan for dependency vulnerabilities
bun audit

# Test SSL (if HTTPS)
openssl s_client -connect yourdomain.com:443
```

## 🐛 Report a Vulnerability

If you discover a security flaw:

1. **DO NOT** create a public issue
2. Contact maintainers privately
3. Allow time to fix before public disclosure

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [RFC 2617 - HTTP Digest Authentication](https://datatracker.ietf.org/doc/html/rfc2617)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

**Stay vigilant and keep your system up to date!** 🛡️
