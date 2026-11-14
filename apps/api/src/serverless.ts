import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';

const express = require('express');

let cachedApp: any = null;

export async function bootstrapServer(): Promise<any> {
  if (!cachedApp) {
    const expressApp = typeof express === 'function' ? express() : express.default();

    // Normalize Vercel URL rewrites so routes map correctly to NestJS controllers
    expressApp.use((req: Request, res: Response, next: any) => {
      const matchedPath = req.headers['x-matched-path'] as string;
      if (matchedPath && (req.url === '/api' || req.url === '/api/')) {
        req.url = matchedPath;
      } else if (req.url === '/api' || req.url === '/api/') {
        req.url = '/';
      }
      if (req.url.startsWith('/api/')) {
        req.url = req.url.replace(/^\/api/, '');
      }
      next();
    });

    // Handle pre-parsed or consumed body from Vercel Serverless runtime
    expressApp.use((req: any, res: any, next: any) => {
      if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'string') {
          try {
            req.body = JSON.parse(req.body);
          } catch (e) {}
        }
        req._body = true;
      } else if (req.readable === false || req.readableEnded) {
        req.body = req.body || {};
        req._body = true;
      }
      next();
    });

    // Only run express body parser if stream has not already been consumed
    expressApp.use((req: any, res: any, next: any) => {
      if (req._body) {
        return next();
      }
      return express.json({ limit: '25mb' })(req, res, (err: any) => {
        if (err) return next(err);
        return express.urlencoded({ extended: true, limit: '25mb' })(req, res, next);
      });
    });

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      bodyParser: false,
    });

    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    cachedApp = expressApp;
  }

  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {}
      }
      req._body = true;
    } else if (req.readable === false || req.readableEnded) {
      req.body = req.body || {};
      req._body = true;
    }

    const server = await bootstrapServer();
    return server(req, res);
  } catch (error: any) {
    console.error('Serverless execution error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error?.message || 'Serverless initialization failed',
          tip: 'Check that DATABASE_URL and JWT_SECRET are configured in Vercel Environment Variables.',
        }),
      );
    }
  }
}
