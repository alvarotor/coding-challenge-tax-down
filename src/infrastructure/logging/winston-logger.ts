import winston from 'winston';
import { Logger } from './logger';

// Import transports conditionally to avoid requiring all dependencies
let CloudWatchTransport: any;
let ElasticsearchTransport: any;
let DatadogWinston: any;

// Only load the required transport based on configuration
if ( process.env.LOG_STORAGE === 'cloudwatch' )
{
    try
    {
        CloudWatchTransport = require( 'winston-cloudwatch' );
    } catch ( error )
    {
        console.error( 'winston-cloudwatch package is required for CloudWatch logging' );
    }
} else if ( process.env.LOG_STORAGE === 'elasticsearch' )
{
    try
    {
        ElasticsearchTransport = require( 'winston-elasticsearch' ).ElasticsearchTransport;
    } catch ( error )
    {
        console.error( 'winston-elasticsearch package is required for Elasticsearch logging' );
    }
} else if ( process.env.LOG_STORAGE === 'datadog' )
{
    try
    {
        DatadogWinston = require( 'datadog-winston' );
    } catch ( error )
    {
        console.error( 'datadog-winston package is required for Datadog logging' );
    }
}

export class WinstonLogger implements Logger
{
    private logger: winston.Logger;

    constructor()
    {
        const transports: winston.transport[] = [
            // Console transport is always included
            new winston.transports.Console( {
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            } ),
        ];

        // Add file transports for local development or if explicitly enabled
        if ( process.env.LOG_TO_FILE !== 'false' )
        {
            transports.push(
                new winston.transports.File( { filename: 'error.log', level: 'error' } ),
                new winston.transports.File( { filename: 'combined.log' } )
            );
        }

        // Add the configured remote logging transport
        this.addRemoteTransport( transports );

        this.logger = winston.createLogger( {
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            defaultMeta: { service: 'motorbike-shop-api', environment: process.env.NODE_ENV },
            transports
        } );
    }

    private addRemoteTransport ( transports: winston.transport[] ): void
    {
        const logStorage = process.env.LOG_STORAGE;

        if ( !logStorage || logStorage === 'file' )
        {
            // Use only file logging (already added)
            return;
        }

        switch ( logStorage )
        {
            case 'cloudwatch':
                if ( CloudWatchTransport )
                {
                    transports.push( new CloudWatchTransport( {
                        logGroupName: process.env.CLOUDWATCH_GROUP_NAME || '/aws/lambda/motorbike-shop-api',
                        logStreamName: `${ process.env.NODE_ENV }-${ new Date().toISOString().split( 'T' )[ 0 ] }`,
                        awsRegion: process.env.AWS_REGION || 'us-east-1',
                        messageFormatter: ( { level, message, ...meta }: { level: string, message: string, meta: Record<string, any> } ) => JSON.stringify( {
                            level,
                            message,
                            ...meta
                        } )
                    } ) );
                }
                break;

            case 'elasticsearch':
                if ( ElasticsearchTransport )
                {
                    transports.push( new ElasticsearchTransport( {
                        level: process.env.LOG_LEVEL || 'info',
                        clientOpts: {
                            node: process.env.ELASTICSEARCH_URL,
                            auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
                                username: process.env.ELASTICSEARCH_USERNAME,
                                password: process.env.ELASTICSEARCH_PASSWORD
                            } : undefined
                        },
                        indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'motorbike-shop-logs'
                    } ) );
                }
                break;

            case 'datadog':
                if ( DatadogWinston )
                {
                    transports.push( new DatadogWinston( {
                        apiKey: process.env.DATADOG_API_KEY,
                        hostname: process.env.HOSTNAME,
                        service: 'motorbike-shop-api',
                        ddsource: 'nodejs',
                        ddtags: `env:${ process.env.NODE_ENV }`
                    } ) );
                }
                break;

            default:
                console.warn( `Unknown LOG_STORAGE value: ${ logStorage }. Using file logging only.` );
        }
    }

    public debug ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.debug( message, meta );
    }

    public info ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.info( message, meta );
    }

    public warn ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.warn( message, meta );
    }

    public error ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.error( message, meta );
    }
} 