# Render Deployment Guide

This guide will help you deploy your DeckDev application to Render with a PostgreSQL database.

## Prerequisites

1. Render API token: `rnd_CcvyeeFeXwx3Xoozp2i9dydIfrcT`
2. Account: 7's workspace (luky.dratva@gmail.com)

## Deployment Steps

### 1. Automatic Deployment

Run the deployment script:

```bash
npm run deploy:render
```

### 2. Manual Deployment via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create a new PostgreSQL database:
   - Name: `deckdev-db`
   - Database: `deckdev`
   - User: `deckdev_user`
   - Plan: Free

3. Create a new Web Service:
   - Name: `deckdev-app`
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free

### 3. Environment Variables

Set these environment variables in your Render service:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<provided by Render database>
```

## Database Connection

The application is configured to connect to PostgreSQL using the `DATABASE_URL` environment variable provided by Render.

### Database Utilities

- `src/config/database.js` - Database configuration
- `src/utils/database.js` - Database connection utilities

## API Endpoints

- Health Check: `/health`
- Webhook: `/webhook`
- Main App: `/` (serves React app)

## Monitoring

- Service URL: `https://deckdev-app.onrender.com`
- Health Check: `https://deckdev-app.onrender.com/health`

## Troubleshooting

1. Check Render logs in the dashboard
2. Verify environment variables are set
3. Test database connection with health endpoint
4. Check build logs for any build failures

## Files Added for Render Deployment

- `render.yaml` - Render configuration
- `deploy-to-render.js` - Automated deployment script
- `src/config/database.js` - Database configuration
- `src/utils/database.js` - Database utilities
- `RENDER_DEPLOYMENT.md` - This guide
