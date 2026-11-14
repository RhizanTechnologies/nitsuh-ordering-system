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
      }
      if (req.url.startsWith('/api/')) {
        req.url = req.url.replace(/^\/api/, '');
      }
      next();
    });

    expressApp.use(express.json({ limit: '25mb' }));
    expressApp.use(express.urlencoded({ extended: true, limit: '25mb' }));

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    app.enableCors({
      origin: '*',
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

export default async function handler(req: Request, res: Response) {
  const server = await bootstrapServer();
  return server(req, res);
}
