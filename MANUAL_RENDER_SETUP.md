# Manual Render Setup Guide

Since the API endpoints for creating databases and services seem to have different paths, here's how to set up your deployment manually through the Render dashboard.

## Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Configure the database:
   - **Name**: `deckdev-db`
   - **Database**: `deckdev`
   - **User**: `deckdev_user`
   - **Region**: Oregon (or closest to your users)
   - **Plan**: Free
4. Click "Create Database"
5. **Important**: Copy the **Internal Database URL** and **External Database URL** - you'll need these later

## Step 2: Create Web Service

1. In your Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository (you'll need to push your code to GitHub first)
3. Configure the service:
   - **Name**: `deckdev-app`
   - **Environment**: Node
   - **Region**: Oregon (same as database)
   - **Branch**: main
   - **Root Directory**: `/`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Step 3: Set Environment Variables

In your web service settings, add these environment variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste the External Database URL from Step 1>
```

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Your app will be available at: `https://deckdev-app.onrender.com`

## Step 5: Verify Deployment

Test these endpoints:
- Health check: `https://deckdev-app.onrender.com/health`
- Webhook: `https://deckdev-app.onrender.com/webhook`
- Main app: `https://deckdev-app.onrender.com`

## Database Connection Details

Your database connection string will look like:
```
postgresql://deckdev_user:password@hostname:5432/deckdev
```

The application is already configured to use the `DATABASE_URL` environment variable.

## Troubleshooting

1. **Build fails**: Check the build logs in Render dashboard
2. **App crashes**: Check the runtime logs
3. **Database connection fails**: Verify `DATABASE_URL` is set correctly
4. **Health check fails**: Make sure the `/health` endpoint is working

## Next Steps

After deployment:
1. Test all endpoints
2. Set up monitoring
3. Configure custom domain (optional)
4. Set up SSL certificates (automatic with Render)
