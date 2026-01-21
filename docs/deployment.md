# Deployment Guide

ClipSqueeze is a static site that can be deployed to any static hosting provider for free.

## Quick Start

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting provider

## Cloudflare Pages (Recommended)

Cloudflare Pages offers the best performance with their global CDN.

### Method 1: Git Integration

1. Push your code to GitHub or GitLab

2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)

3. Click "Create a project" → "Connect to Git"

4. Select your repository

5. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or your app subdirectory)

6. Click "Save and Deploy"

7. Your site will be available at `your-project.pages.dev`

### Method 2: Direct Upload

1. Build locally:
   ```bash
   npm run build
   ```

2. Go to Cloudflare Pages dashboard

3. Click "Create a project" → "Direct Upload"

4. Drag and drop the `dist/` folder

5. Deploy!

### Custom Domain (Optional)

1. In your Pages project, go to "Custom domains"
2. Add your domain
3. Configure DNS records as instructed

### Environment Variables

No environment variables are required for basic deployment.

Optional:
- `NODE_VERSION`: Set to `20` if needed

---

## GitHub Pages

GitHub Pages is great for open-source projects.

### Method 1: GitHub Actions (Automated)

The CI workflow already includes deployment. To enable:

1. Go to repository Settings → Pages

2. Under "Build and deployment", select:
   - **Source**: GitHub Actions

3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - run: npm ci
      - run: npm run build
      
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

4. Push to main branch to trigger deployment

### Method 2: Manual Deploy

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy using `gh-pages`:
   ```bash
   npm install -g gh-pages
   gh-pages -d dist
   ```

3. Enable GitHub Pages for `gh-pages` branch

### Base Path Configuration

If deploying to `username.github.io/repo-name/`, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/repo-name/',
  // ... rest of config
});
```

---

## Vercel

1. Push code to GitHub

2. Go to [Vercel](https://vercel.com/) and import your repository

3. Framework will be auto-detected. Verify settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Deploy!

---

## Netlify

1. Push code to GitHub

2. Go to [Netlify](https://netlify.com/) and create new site from Git

3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. Deploy!

### SPA Routing

Create `public/_redirects`:
```
/*    /index.html   200
```

---

## Security Headers

For enhanced security, configure these headers:

### Cloudflare Pages (`_headers` file)

Create `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### For SharedArrayBuffer Support (Future)

If you need SharedArrayBuffer for advanced optimizations:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

⚠️ Note: Enabling COEP may break external resources without proper CORS headers.

---

## Troubleshooting

### Build Fails

1. Ensure Node.js 18+ is being used
2. Delete `node_modules` and `package-lock.json`, then reinstall
3. Check for TypeScript errors: `npm run typecheck`

### Blank Page After Deploy

1. Check browser console for errors
2. Verify `base` path in `vite.config.ts` matches your deployment URL
3. Ensure `dist/index.html` exists

### WebCodecs Not Working

WebCodecs requires:
- HTTPS (or localhost)
- Chromium-based browser

Check browser compatibility on your deployment URL.

### Large Bundle Warning

If your bundle is too large:
1. Check for unnecessary imports
2. Verify tree-shaking is working
3. Consider lazy loading heavy components

---

## Performance Optimization

### Caching

Configure long cache times for static assets:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Compression

Most hosts enable gzip/brotli by default. Verify compression is working:

```bash
curl -H "Accept-Encoding: gzip" -I https://your-site.com/
```

Look for `Content-Encoding: gzip` in response.

### Preloading

The app preloads critical resources. No additional configuration needed.
