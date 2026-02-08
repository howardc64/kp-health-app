# 🏥 Kaiser Permanente Health Records App

A secure web application to access your Kaiser Permanente health records using the official FHIR API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![FHIR](https://img.shields.io/badge/FHIR-R4-green.svg)
![OAuth](https://img.shields.io/badge/OAuth-2.0-orange.svg)

## 🌟 Features

- 📊 **Patient Demographics** - View your personal information
- 💊 **Medications** - See all your active and past medications
- 🤧 **Allergies** - Track allergies and intolerances
- 🩺 **Conditions** - View medical conditions and diagnoses
- ❤️ **Vital Signs** - Monitor blood pressure, weight, and more
- 🧪 **Lab Results** - Access laboratory test results
- 💉 **Immunizations** - View vaccination history
- 📋 **Procedures** - See medical procedures performed

## 🚀 Quick Deploy

### GitHub Pages (Easiest - 5 minutes)

1. **Fork this repository** (click Fork button above)
2. **Go to Settings → Pages**
3. **Source**: Deploy from `main` branch
4. **Save** - Your site is live!

📝 **[Read Full Quick Start Guide](QUICK_START.md)**

## 🔑 Setup

1. **Register with Kaiser Permanente**
   - Visit: https://healthy.kaiserpermanente.org/learn/api
   - Get your `client_id`

2. **Update Configuration**
   - Edit `index.html` line 202
   - Set your `CLIENT_ID` and `REDIRECT_URI`

3. **Deploy** (see options below)

## 🌐 Deployment Options

| Platform | Difficulty | Time | Link |
|----------|-----------|------|------|
| GitHub Pages | ⭐ Easy | 5 min | [Guide](QUICK_START.md) |
| Netlify | ⭐⭐ Moderate | 3 min | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start) |
| Vercel | ⭐⭐ Moderate | 3 min | [Deploy](https://vercel.com/new) |

📖 **[Full Deployment Guide](DEPLOYMENT_GUIDE.md)**

## 🔒 Security

- ✅ HTTPS encryption
- ✅ OAuth 2.0 with PKCE
- ✅ No backend server
- ✅ No data storage
- ✅ HIPAA compliant design

## 📱 Usage

1. Visit your deployed URL
2. Click "Login with Kaiser Permanente"
3. Enter KP credentials
4. View your health records!

## 🛠️ Tech Stack

- HTML5/CSS3/JavaScript
- FHIR R4 API
- OAuth 2.0
- Kaiser Permanente API

## 📚 Documentation

- [Quick Start](QUICK_START.md) - Deploy in 5 minutes
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - All hosting options
- [Kaiser Permanente README](KAISER_PERMANENTE_README.md) - API details

## 🐛 Troubleshooting

**Redirect URI mismatch?**
→ Update redirect URI in Kaiser Permanente portal to match deployed URL

**Invalid client_id?**
→ Check CLIENT_ID in index.html matches Kaiser Permanente portal

**OAuth errors?**
→ Clear browser cache, try incognito mode

## 📄 License

MIT License - free to use and modify

## ⚠️ Disclaimer

Not affiliated with Kaiser Permanente. For personal use only. Verify medical information with your healthcare provider.

## 🙏 Credits

Built with Kaiser Permanente FHIR API and HL7 FHIR standards.

---

**Made with ❤️ for better health data access**
