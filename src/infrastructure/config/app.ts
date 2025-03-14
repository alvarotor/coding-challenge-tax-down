import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Logger } from '../logging/logger';
import { WinstonLogger } from '../logging/winston-logger';
import { customerRouter } from '../http/routes/customer.routes';
import { MongoCustomerRepository } from '../database/mongodb/customer.repository.impl';
import { CreateCustomerUseCase } from '../../application/customer/create-customer.use-case';
import { GetCustomerUseCase } from '../../application/customer/get-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/customer/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../application/customer/delete-customer.use-case';
import { AddCreditUseCase } from '../../application/customer/add-credit.use-case';
import { GetCustomersSortedByCreditUseCase } from '../../application/customer/get-customers-sorted-by-credit.use-case';
import { CustomerController } from '../../interfaces/api/customer.controller';
import { TracingService } from '../tracing/tracer';
import { HealthCheckService } from '../health/health-check';
import { errorHandler } from '../../interfaces/middleware/error-handler.middleware';
import { healthCheckRouter } from '../health/health-check';
import { CacheService } from '../cache/cache.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { CachedCustomerRepository } from '../database/mongodb/cached-customer.repository';
import { MongoConnectionManager } from '../database/mongodb/connection-manager';

export class App
{
    private app: Application;
    private logger: Logger;
    private tracingService: TracingService;
    private cacheService: CacheService | null;
    private connectionManager: MongoConnectionManager;

    constructor()
    {
        this.app = express();
        this.logger = new WinstonLogger();
        this.tracingService = new TracingService( this.logger );
        this.cacheService = null;
        this.connectionManager = new MongoConnectionManager( this.logger );

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();

        // Start distributed tracing if enabled
        if ( process.env.ENABLE_TRACING === 'true' )
        {
            this.tracingService.start();
        }

        // Monitor database connection events
        this.connectionManager.on( 'error', ( err ) =>
        {
            this.logger.error( 'Database connection error detected in main app', { error: err.message } );
            // Here you could implement circuit breaker logic or alerts
        } );
    }

    private initializeMiddlewares (): void
    {
        this.app.use( express.json() );
        this.app.use( express.urlencoded( { extended: true } ) );
        this.app.use( cors() );
        this.app.use( helmet() );

        // Add request ID middleware for tracing
        this.app.use( ( req: Request, res: Response, next: NextFunction ) =>
        {
            req.id = ( req.headers[ 'x-request-id' ] as string ) || crypto.randomUUID();
            res.setHeader( 'x-request-id', req.id );
            next();
        } );

        // Add request logging
        this.app.use( ( req: Request, res: Response, next: NextFunction ) =>
        {
            this.logger.info( `Incoming request`, {
                method: req.method,
                path: req.path,
                requestId: req.id
            } );

            const start = Date.now();

            res.on( 'finish', () =>
            {
                const duration = Date.now() - start;
                this.logger.info( `Request completed`, {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration,
                    requestId: req.id
                } );
            } );

            next();
        } );
    }

    private initializeRoutes (): void
    {
        // Enhanced health check
        const healthCheckService = new HealthCheckService( this.logger );
        this.app.get( '/health', ( req, res ) => healthCheckService.check( req, res ) );

        // Initialize cache service
        this.cacheService = new RedisCacheService( this.logger );

        // Customer repositories with caching
        const baseCustomerRepository = new MongoCustomerRepository( this.logger );
        const customerRepository = new CachedCustomerRepository(
            baseCustomerRepository,
            this.cacheService,
            this.logger,
            parseInt( process.env.CUSTOMER_CACHE_TTL || '3600' ) // Default 1 hour, configurable
        );

        const createCustomerUseCase = new CreateCustomerUseCase( customerRepository, this.logger );
        const getCustomerUseCase = new GetCustomerUseCase( customerRepository, this.logger );
        const updateCustomerUseCase = new UpdateCustomerUseCase( customerRepository, this.logger );
        const deleteCustomerUseCase = new DeleteCustomerUseCase( customerRepository, this.logger );
        const addCreditUseCase = new AddCreditUseCase( customerRepository, this.logger );
        const getCustomersSortedByCreditUseCase = new GetCustomersSortedByCreditUseCase( customerRepository, this.logger );

        const customerController = new CustomerController(
            createCustomerUseCase,
            getCustomerUseCase,
            updateCustomerUseCase,
            deleteCustomerUseCase,
            addCreditUseCase,
            getCustomersSortedByCreditUseCase,
            this.logger
        );

        this.app.use( '/api/customers', customerRouter( customerController ) );
        this.app.use( '/health', healthCheckRouter );
    }

    private initializeErrorHandling (): void
    {
        this.app.use( errorHandler );
    }

    public async connectToDatabase (): Promise<void>
    {
        console.log( 'Connecting to database...' );
        try
        {
            // Use the connection from setup.ts if in test mode
            if ( process.env.NODE_ENV === 'test' )
            {
                console.log( 'Using existing MongoDB connection from test setup' );
                return;
            }

            // Use our new connection manager
            await this.connectionManager.connect(
                process.env.MONGODB_URI || 'mongodb://localhost:27017/motorbike-shop'
            );
        } catch ( error )
        {
            console.error( 'Failed to connect to MongoDB:', error );
            throw error;
        }
    }

    public getServer (): Application
    {
        return this.app;
    }

    public async shutdown (): Promise<void>
    {
        this.logger.info( 'Application shutting down...' );

        // Disconnect database
        try
        {
            await this.connectionManager.disconnect();
        } catch ( error )
        {
            this.logger.error( 'Error during database disconnection', { error: ( error as Error ).message } );
        }

        // Graceful shutdown of tracing
        if ( process.env.ENABLE_TRACING === 'true' )
        {
            await this.tracingService.shutdown();
        }

        // Shutdown cache connections
        if ( this.cacheService )
        {
            await this.cacheService.shutdown();
        }

        this.logger.info( 'Application shutdown complete' );
    }

    async start (): Promise<void>
    {
        const port = process.env.PORT || 3000;
        await new Promise<void>( resolve =>
        {
            this.app.listen( port, () =>
            {
                console.log( `Server is running on port ${ port }` );
                resolve();
            } );
        } );
    }
} 