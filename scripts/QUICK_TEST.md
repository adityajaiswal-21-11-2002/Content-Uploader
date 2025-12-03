# Quick Test Guide

## 🚀 Quick Start

### 1. Start your dev server
```bash
pnpm dev
```

### 2. Run all tests
```bash
pnpm test:all
```

That's it! The test suite will verify all features.

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run feature tests (recommended) |
| `pnpm test:db` | Test database connection |
| `pnpm test:api` | Test API endpoints |
| `pnpm test:all` | Run all tests |

---

## ✅ What Gets Tested

- ✅ Server connection
- ✅ Database initialization
- ✅ Employee API
- ✅ Topics API
- ✅ Upload tracking
- ✅ Weekly summary
- ✅ Email alerts
- ✅ Cron jobs
- ✅ Database collections

---

## 🎯 Quick Test Checklist

Run these in order:

1. **Start Server**
   ```bash
   pnpm dev
   ```

2. **Test Everything**
   ```bash
   pnpm test:all
   ```

3. **Manual Verification** (optional)
   - Visit `http://192.168.29.42:3000`
   - Visit `http://192.168.29.42:3000/admin`
   - Visit `http://192.168.29.42:3000/employee/1`

---

## 📊 Expected Results

If everything works, you should see:
```
✅ Passed: 8+
❌ Failed: 0
📊 Total: 8+
📈 Success Rate: 100%

🎉 All tests passed!
```

---

## 🐛 Troubleshooting

### "Server not accessible"
→ Start dev server: `pnpm dev`
→ Make sure server is running on port 3000
→ Check if server is accessible at `http://192.168.29.42:3000`

### "DATABASE_URL not set"
→ Check your `.env` file

### Some tests skipped (⚠️)
→ Optional features (OpenAI, SMTP) - can ignore if not configured

---

## 📚 More Info

See `TESTING.md` for detailed documentation.

