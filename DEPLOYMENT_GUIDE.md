# Kaiser Permanente FHIR App - Deployment Guide

This guide explains how to deploy your Kaiser Permanente FHIR application to free web hosting platforms.

## Quick Start - Free Hosting Options

### Option 1: GitHub Pages (Simplest - Static Only)

**Steps:**
1. Create a GitHub account at https://github.com
2. Create a new repository (e.g., "kp-health-app")
3. Upload these files:
   - `index.html`
   - `kaiser_permanente_fhir_client.js`
4. Go to Settings → Pages
5. Select "Deploy from main branch"
6. Your site will be live at: `https://yourusername.github.io/kp-health-app`

**Update your Kaiser Permanente redirect URI to:**
```
https://yourusername.github.io/kp-health-app/
```

---

### Option 2: Netlify (Recommended - Easy with CLI)

**Steps:**

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify:**
```bash
netlify login
```

3. **Deploy:**
```bash
cd /path/to/your/project
netlify deploy
```

4. **Follow prompts:**
   - Create & configure a new site
   - Deploy path: `.` (current directory)

5. **Deploy to production:**
```bash
netlify deploy --prod
```

**Your site will be live at:** `https://your-site-name.netlify.app`

**Netlify Features:**
- ✅ Free SSL certificate
- ✅ Custom domain support
- ✅ Automatic deploys from Git
- ✅ Form handling
- ✅ Serverless functions

---

### Option 3: Vercel (Best for Node.js Apps)

**Steps:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd /path/to/your/project
vercel
```

4. **Follow prompts and deploy to production:**
```bash
vercel --prod
```

**Your site will be live at:** `https://your-project.vercel.app`

**Vercel Features:**
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Edge network
- ✅ Git integration

---

### Option 4: Render (Good for Full-Stack Apps)

**Steps:**

1. Go to https://render.com and sign up
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - Build Command: (leave empty or `npm install`)
   - Publish Directory: `.`
5. Click "Create Static Site"

**Your site will be live at:** `https://your-site.onrender.com`

---

### Option 5: Cloudflare Pages

**Steps:**

1. Go to https://pages.cloudflare.com
2. Sign up for free account
3. Click "Create a project"
4. Connect to Git or upload files directly
5. Configure build settings:
   - Build command: (none needed)
   - Build output directory: `.`
6. Deploy

**Your site will be live at:** `https://your-project.pages.dev`

---

## Before You Deploy - Important Steps

### 1. Register Your Application with Kaiser Permanente

Visit: https://healthy.kaiserpermanente.org/learn/api

You'll need to provide:
- Application name
- Description
- **Redirect URI** (your deployed URL + `/` or `/callback`)
- Contact information

Example redirect URIs:
- `https://your-site.netlify.app/`
- `https://yourusername.github.io/kp-health-app/`
- `https://your-project.vercel.app/`

### 2. Update Your Code

After getting your `client_id` and knowing your deployment URL:

**In `index.html`, update line ~202:**
```javascript
const CLIENT_ID = 'your_actual_client_id_from_kaiser';
const REDIRECT_URI = 'https://your-deployed-url.com/';
```

### 3. Update Redirect URI in Kaiser Permanente Portal

Go back to Kaiser Permanente developer portal and add your production redirect URI.

---

## Deployment Comparison

| Platform | Best For | Difficulty | Features |
|----------|----------|------------|----------|
| **GitHub Pages** | Static sites | ⭐ Easy | Free, simple, reliable |
| **Netlify** | Most projects | ⭐⭐ Moderate | Forms, functions, great DX |
| **Vercel** | Next.js/React | ⭐⭐ Moderate | Serverless, fast, scalable |
| **Render** | Full-stack apps | ⭐⭐⭐ Advanced | Databases, cron jobs |
| **Cloudflare Pages** | High traffic | ⭐⭐ Moderate | Global CDN, fast |

---

## Quick Deploy with GitHub Pages (Fastest)

1. **Create repository on GitHub**

2. **Add files:**
```bash
git init
git add index.html kaiser_permanente_fhir_client.js
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/kp-health-app.git
git push -u origin main
```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch `main`
   - Save

4. **Your site is live!**
   - URL: `https://yourusername.github.io/kp-health-app/`

---

## Environment Variables (For Production)

If you want to hide your client_id from source code:

### Netlify
1. Dashboard → Site Settings → Environment Variables
2. Add: `KP_CLIENT_ID=your_client_id`
3. Update code to read from environment

### Vercel
1. Project Settings → Environment Variables
2. Add: `KP_CLIENT_ID=your_client_id`

---

## Testing Your Deployment

1. **Visit your deployed URL**
2. **Click "Login with Kaiser Permanente"**
3. **You should be redirected to Kaiser Permanente login**
4. **After login, you'll be redirected back to your app**
5. **Your health data should load**

---

## Troubleshooting

### "Redirect URI mismatch" error
- **Solution**: Update redirect URI in Kaiser Permanente portal to match your deployed URL exactly

### "Invalid client_id" error
- **Solution**: Double-check your client_id in the code

### CORS errors
- **Solution**: Use proper HTTPS URLs, ensure redirect URI matches

### OAuth state mismatch
- **Solution**: Clear browser cache and cookies, try again

---

## Security Best Practices for Production

1. **Always use HTTPS** (all free hosts provide this)
2. **Don't commit secrets** to Git
3. **Use environment variables** for sensitive data
4. **Implement proper session management**
5. **Add CSP headers** for security
6. **Enable 2FA** on your hosting account
7. **Monitor access logs**
8. **Set up alerts** for unusual activity

---

## Custom Domain (Optional)

All platforms support custom domains:

### Netlify/Vercel
1. Go to Domain Settings
2. Add your custom domain
3. Update DNS records at your domain registrar
4. Wait for SSL certificate (automatic)

### GitHub Pages
1. Repository Settings → Pages
2. Add custom domain
3. Create CNAME file in repository
4. Update DNS records

---

## Monitoring and Analytics

### Add Google Analytics
```html
<!-- Add to index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Built-in Analytics
- **Netlify**: Built-in analytics available
- **Vercel**: Analytics available on Pro plan
- **Cloudflare**: Free analytics included

---

## Next Steps

1. ✅ Choose a hosting platform
2. ✅ Deploy your application
3. ✅ Register with Kaiser Permanente
4. ✅ Update client_id and redirect_uri
5. ✅ Test the OAuth flow
6. ✅ Share with users!

---

## Support

- **Kaiser Permanente API**: https://healthy.kaiserpermanente.org/learn/api
- **Netlify Docs**: https://docs.netlify.com
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Pages**: https://pages.github.com

---

## Example: Complete Netlify Deployment

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Navigate to your project
cd /path/to/kaiser-permanente-app

# 3. Login to Netlify
netlify login

# 4. Initialize and deploy
netlify init

# 5. Deploy to production
netlify deploy --prod

# Your app is now live!
# Update the redirect URI in Kaiser Permanente portal
# Update CLIENT_ID in index.html
# Test your application
```

---

## Cost

All mentioned platforms offer **free tiers** that are sufficient for this application:

- **GitHub Pages**: Free unlimited (public repos)
- **Netlify**: Free tier - 100GB bandwidth/month
- **Vercel**: Free tier - 100GB bandwidth/month
- **Render**: Free tier with some limitations
- **Cloudflare Pages**: Free unlimited bandwidth

No credit card required for basic usage! 🎉
