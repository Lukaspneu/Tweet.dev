#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RENDER_API_TOKEN = 'rnd_CcvyeeFeXwx3Xoozp2i9dydIfrcT';
const RENDER_API_BASE = 'https://api.render.com/v1';
const OWNER_ID = 'tea-d31bk3vdiees73aokfc0';

class RenderDeployer {
  constructor() {
    this.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_API_TOKEN}`
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${RENDER_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async createDatabase() {
    console.log('Creating PostgreSQL database...');
    
    const dbData = {
      name: 'deckdev-db',
      databaseName: 'deckdev',
      user: 'deckdev_user',
      plan: 'free',
      region: 'oregon',
      ownerId: OWNER_ID
    };

    try {
      const db = await this.makeRequest('/databases', {
        method: 'POST',
        body: JSON.stringify(dbData)
      });
      
      console.log('Database created:', db);
      return db;
    } catch (error) {
      console.log('Database might already exist or error occurred:', error.message);
      // Try to get existing database
      const services = await this.makeRequest('/services');
      const existingDb = services.find(s => s.name === 'deckdev-db');
      if (existingDb) {
        console.log('Using existing database:', existingDb);
        return existingDb;
      }
      throw error;
    }
  }

  async createWebService() {
    console.log('Creating web service...');
    
    const serviceData = {
      type: 'web_service',
      name: 'deckdev-app',
      repo: null, // We'll deploy from files
      branch: 'main',
      rootDir: '/',
      plan: 'free',
      region: 'oregon',
      buildCommand: 'npm install && npm run build',
      startCommand: 'npm start',
      healthCheckPath: '/health',
      ownerId: OWNER_ID,
      envVars: [
        {
          key: 'NODE_ENV',
          value: 'production'
        },
        {
          key: 'PORT',
          value: '3000'
        }
      ]
    };

    try {
      const service = await this.makeRequest('/services', {
        method: 'POST',
        body: JSON.stringify(serviceData)
      });
      
      console.log('Web service created:', service);
      return service;
    } catch (error) {
      console.log('Service might already exist or error occurred:', error.message);
      // Try to get existing service
      const services = await this.makeRequest('/services');
      const existingService = services.find(s => s.name === 'deckdev-app');
      if (existingService) {
        console.log('Using existing service:', existingService);
        return existingService;
      }
      throw error;
    }
  }

  async deploy() {
    try {
      console.log('Starting Render deployment...');
      
      // Step 1: Create database
      const database = await this.createDatabase();
      
      // Step 2: Create web service
      const service = await this.createWebService();
      
      console.log('Deployment initiated successfully!');
      console.log('Database:', database);
      console.log('Service:', service);
      
      if (service.service) {
        console.log(`Your app will be available at: https://${service.service.name}.onrender.com`);
      }
      
    } catch (error) {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Run deployment
const deployer = new RenderDeployer();
deployer.deploy();
