#!/bin/bash

# Script to set up Git repository for Render deployment

echo "🚀 Setting up Git repository for Render deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
fi

# Add all files
echo "Adding files to Git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit - DeckDev app ready for Render deployment"

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote repository configured."
    echo "Please create a GitHub repository and run:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "git push -u origin main"
else
    echo "Pushing to remote repository..."
    git push -u origin main
fi

echo "✅ Git setup complete!"
echo ""
echo "Next steps:"
echo "1. If you haven't created a GitHub repo yet, create one at https://github.com/new"
echo "2. Connect your GitHub repo to Render for automatic deployments"
echo "3. Follow the MANUAL_RENDER_SETUP.md guide"
