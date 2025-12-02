# 🚀 Quick Start Guide

## ⚠️ Required Setup

### 1. Configure credentials

Edit the `.env` file:

```bash
# Use your preferred editor
nano .env
# or
vim .env
# or open it in your IDE
```

**Replace the default values:**

```env
ANTMINER_HOST=http://192.168.1.100        # ← Your Antminer IP
ANTMINER_USERNAME=root                     # ← Usually 'root'
ANTMINER_PASSWORD=your_password_here       # ← YOUR PASSWORD HERE!
```

### 2. Start the application

```bash
bun dev
```

### 3. Open the dashboard

Open your browser at: [http://localhost:3000](http://localhost:3000)

---

## 🔍 Connection Verification

If you see a 401 error, check:

1. ✅ The password in `.env` is correct
2. ✅ The Antminer IP is accessible (test with `ping <your-ip>`)
3. ✅ The username is correct (usually `root`)
4. ✅ The Antminer is powered on and connected to the network

### Connectivity test

```bash
# Ping test
ping <your-antminer-ip>

# HTTP test (should return 401)
curl -I http://<your-antminer-ip>/cgi-bin/get_system_info.cgi
```

---

## 🎯 Quick checklist

- [ ] `.env` file created
- [ ] Antminer password configured
- [ ] Antminer IP correct
- [ ] Antminer accessible on network
- [ ] Application started with `bun dev`
- [ ] Dashboard open at http://localhost:3000

---

## 💡 Common Issues

### "Error: Missing required environment variables"

→ The `.env` file doesn't exist or is misconfigured

**Solution:** Check that the file exists and contains all variables

### "Error: HTTP error! status: 401"

→ Incorrect credentials

**Solution:** Verify the password in `.env`

### "ECONNREFUSED" or "Network error"

→ The Antminer is not accessible

**Solution:** 
- Check the IP with `ping`
- Verify the Antminer is on the same network
- Check firewall settings

---

## 🎉 Everything working?

You should see:

- ✅ Status "Connected to Antminer" in green
- ✅ System data displayed
- ✅ Auto-refresh every 10 seconds

**Enjoy your dashboard! 🚀**
