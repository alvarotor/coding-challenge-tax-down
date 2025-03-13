import winston from 'winston';
import { Logger } from '../../domain/logger.interface';

export class WinstonLogger implements Logger
{
    private logger: winston.Logger;

    constructor()
    {
        this.logger = winston.createLogger( {
            level: 'debug',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console()
            ]
        } );
    }

    info ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.info( { message, ...meta } );
    }

    error ( message: string, error?: Error | Record<string, any> ): void
    {
        this.logger.error( { message, ...( error instanceof Error ? { error } : error ) } );
    }

    debug ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.debug( { message, ...meta } );
    }

    warn ( message: string, meta?: Record<string, any> ): void
    {
        this.logger.warn( { message, ...meta } );
    }
} 