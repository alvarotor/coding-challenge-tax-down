import express, { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Logger } from '../logging/logger';
import { CacheService } from '../cache/cache.service';

export class HealthCheckService
{
    constructor(
        private readonly logger: Logger,
        private readonly cacheService?: CacheService
    ) { }

    async check ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const health = {
                status: 'ok',
                timestamp: new Date(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
                services: {
                    database: await this.checkDatabaseConnection(),
                    cache: await this.checkCacheConnection()
                }
            };

            res.status( 200 ).json( health );
        } catch ( error )
        {
            this.logger.error( 'Health check failed', { error: ( error as Error ).message } );

            res.status( 503 ).json( {
                status: 'error',
                timestamp: new Date(),
                error: ( error as Error ).message
            } );
        }
    }

    private async checkDatabaseConnection (): Promise<{ status: string; responseTime?: number }>
    {
        const startTime = Date.now();

        try
        {
            if ( mongoose.connection.readyState !== 1 )
            {
                return { status: 'disconnected' };
            }

            // Perform a simple query to verify the connection is working
            await mongoose.connection.db.admin().ping();

            return {
                status: 'connected',
                responseTime: Date.now() - startTime
            };
        } catch ( error )
        {
            this.logger.error( 'Database health check failed', { error: ( error as Error ).message } );
            return { status: 'error' };
        }
    }

    private async checkCacheConnection (): Promise<{ status: string; responseTime?: number }>
    {
        if ( !this.cacheService || process.env.ENABLE_CACHE !== 'true' )
        {
            return { status: 'disabled' };
        }

        const startTime = Date.now();
        try
        {
            // Test cache with a simple operation
            const testKey = 'health-check-test';
            await this.cacheService.set( testKey, { test: true }, 10 );
            await this.cacheService.get( testKey );

            return {
                status: 'connected',
                responseTime: Date.now() - startTime
            };
        } catch ( error )
        {
            this.logger.error( 'Cache health check failed', { error: ( error as Error ).message } );
            return { status: 'error' };
        }
    }
}

export const healthCheckRouter: Router = express.Router();

healthCheckRouter.get( '/', ( req: Request, res: Response ) =>
{
    const healthCheck = new HealthCheckService( req.app.get( 'logger' ) );
    healthCheck.check( req, res );
} ); 