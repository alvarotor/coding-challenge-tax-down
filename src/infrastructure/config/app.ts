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

export class App
{
    private app: Application;
    private logger: Logger;
    private tracingService: TracingService;

    constructor()
    {
        this.app = express();
        this.logger = new WinstonLogger();
        this.tracingService = new TracingService( this.logger );

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();

        // Start distributed tracing if enabled
        if ( process.env.ENABLE_TRACING === 'true' )
        {
            this.tracingService.start();
        }
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

        // Customer routes
        const customerRepository = new MongoCustomerRepository( this.logger );

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
        try
        {
            await mongoose.connect( process.env.MONGODB_URI || 'mongodb://localhost:27017/motorbike-shop' );
            this.logger.info( 'Connected to MongoDB' );
        } catch ( error )
        {
            this.logger.error( 'MongoDB connection error', { error: ( error as Error ).message } );
            // Implement graceful shutdown
            process.exit( 1 );
        }
    }

    public getServer (): Application
    {
        return this.app;
    }

    public async shutdown (): Promise<void>
    {
        this.logger.info( 'Shutting down application' );

        // Graceful shutdown of tracing
        if ( process.env.ENABLE_TRACING === 'true' )
        {
            await this.tracingService.shutdown();
        }

        // Close database connection
        if ( mongoose.connection.readyState === 1 )
        {
            await mongoose.connection.close();
            this.logger.info( 'Closed MongoDB connection' );
        }
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