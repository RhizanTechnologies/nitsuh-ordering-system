"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapServer = bootstrapServer;
exports.default = handler;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const express = require('express');
let cachedApp = null;
async function bootstrapServer() {
    if (!cachedApp) {
        const expressApp = typeof express === 'function' ? express() : express.default();
        expressApp.use((req, res, next) => {
            const matchedPath = req.headers['x-matched-path'];
            if (matchedPath && (req.url === '/api' || req.url === '/api/')) {
                req.url = matchedPath;
            }
            else if (req.url === '/api' || req.url === '/api/') {
                req.url = '/';
            }
            if (req.url.startsWith('/api/')) {
                req.url = req.url.replace(/^\/api/, '');
            }
            next();
        });
        expressApp.use((req, res, next) => {
            if (req.body !== undefined && req.body !== null) {
                if (typeof req.body === 'string') {
                    try {
                        req.body = JSON.parse(req.body);
                    }
                    catch (e) { }
                }
                req._body = true;
            }
            else if (req.readable === false || req.readableEnded) {
                req.body = req.body || {};
                req._body = true;
            }
            next();
        });
        expressApp.use((req, res, next) => {
            if (req._body) {
                return next();
            }
            return express.json({ limit: '25mb' })(req, res, (err) => {
                if (err)
                    return next(err);
                return express.urlencoded({ extended: true, limit: '25mb' })(req, res, next);
            });
        });
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), {
            bodyParser: false,
        });
        app.enableCors({
            origin: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
        }));
        await app.init();
        cachedApp = expressApp;
    }
    return cachedApp;
}
async function handler(req, res) {
    try {
        if (req.body !== undefined && req.body !== null) {
            if (typeof req.body === 'string') {
                try {
                    req.body = JSON.parse(req.body);
                }
                catch (e) { }
            }
            req._body = true;
        }
        else if (req.readable === false || req.readableEnded) {
            req.body = req.body || {};
            req._body = true;
        }
        const server = await bootstrapServer();
        return server(req, res);
    }
    catch (error) {
        console.error('Serverless execution error:', error);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                statusCode: 500,
                error: 'Internal Server Error',
                message: error?.message || 'Serverless initialization failed',
                tip: 'Check that DATABASE_URL and JWT_SECRET are configured in Vercel Environment Variables.',
            }));
        }
    }
}
//# sourceMappingURL=serverless.js.map