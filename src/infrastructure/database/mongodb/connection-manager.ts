import mongoose from 'mongoose';
import { Logger } from '../../logging/logger';
import { setTimeout } from 'timers/promises';
import { EventEmitter } from 'events';

export class MongoConnectionManager extends EventEmitter
{
    private isConnected = false;
    private retryCount = 0;
    private readonly maxRetries = 5;

    constructor( private readonly logger: Logger )
    {
        super();
    }

    /**
     * Connect to MongoDB with connection pooling configuration
     */
    async connect ( uri: string ): Promise<void>
    {
        try
        {
            if ( this.isConnected )
            {
                this.logger.debug( 'Already connected to MongoDB' );
                return;
            }

            this.logger.info( 'Connecting to MongoDB...' );

            // Connection pooling configuration
            await mongoose.connect( uri, {
                // Set the maximum number of connections in the pool
                maxPoolSize: parseInt( process.env.MONGO_MAX_POOL_SIZE || '10', 10 ),
                // Set the minimum number of connections in the pool
                minPoolSize: parseInt( process.env.MONGO_MIN_POOL_SIZE || '2', 10 ),
                // Maximum time (ms) the driver will wait for a connection to become available
                connectTimeoutMS: parseInt( process.env.MONGO_CONNECT_TIMEOUT || '10000', 10 ),
                // Time (ms) a connection can remain idle before being closed
                socketTimeoutMS: parseInt( process.env.MONGO_SOCKET_TIMEOUT || '45000', 10 ),
                // This enables auto-reconnect on first connection failure
                serverSelectionTimeoutMS: parseInt( process.env.MONGO_SERVER_SELECTION_TIMEOUT || '30000', 10 ),
                // Time to wait for new connections when pool is at max capacity
                waitQueueTimeoutMS: parseInt( process.env.MONGO_WAIT_QUEUE_TIMEOUT || '10000', 10 )
            } );

            this.isConnected = true;
            this.retryCount = 0;
            this.logger.info( 'Successfully connected to MongoDB' );
            this.setupConnectionMonitoring();
            this.emit( 'connected' );
        } catch ( error )
        {
            this.logger.error( 'Failed to connect to MongoDB', {
                error: ( error as Error ).message,
                retry: this.retryCount
            } );

            if ( this.retryCount < this.maxRetries )
            {
                this.retryCount++;
                const delay = Math.min( 1000 * Math.pow( 2, this.retryCount ), 30000 ); // Exponential backoff
                this.logger.info( `Retrying connection in ${ delay }ms...` );
                await setTimeout( delay );
                return this.connect( uri );
            } else
            {
                this.logger.error( 'Max connection retries reached, giving up', { maxRetries: this.maxRetries } );
                this.emit( 'connectionFailed', error );
                throw error;
            }
        }
    }

    /**
     * Set up event listeners for the MongoDB connection
     */
    private setupConnectionMonitoring (): void
    {
        mongoose.connection.on( 'error', ( error ) =>
        {
            this.logger.error( 'MongoDB connection error', { error: error.message } );
            this.isConnected = false;
            this.emit( 'error', error );
        } );

        mongoose.connection.on( 'disconnected', () =>
        {
            this.logger.warn( 'MongoDB disconnected' );
            this.isConnected = false;
            this.emit( 'disconnected' );
        } );

        mongoose.connection.on( 'reconnected', () =>
        {
            this.logger.info( 'MongoDB reconnected' );
            this.isConnected = true;
            this.emit( 'reconnected' );
        } );

        // Monitor connection pool statistics
        if ( process.env.NODE_ENV === 'development' || process.env.MONITOR_DB_POOL === 'true' )
        {
            setInterval( () =>
            {
                const stats = mongoose.connection.db.admin().serverStatus(
                    ( err, result ) =>
                    {
                        if ( !err && result && result.connections )
                        {
                            this.logger.debug( 'MongoDB connection pool stats', {
                                current: result.connections.current,
                                available: result.connections.available,
                                totalCreated: result.connections.totalCreated
                            } );
                        }
                    }
                );
            }, 60000 ); // Check every minute
        }
    }

    /**
     * Get the current connection status
     */
    getStatus (): { isConnected: boolean; poolStats: any }
    {
        const poolStats = ( mongoose.connection as any )?.client?.options?.maxPoolSize || 'unknown';

        return {
            isConnected: this.isConnected,
            poolStats: { maxPoolSize: poolStats }
        };
    }

    /**
     * Gracefully close the MongoDB connection
     */
    async disconnect (): Promise<void>
    {
        this.logger.info( 'Disconnecting from MongoDB...' );

        if ( mongoose.connection.readyState !== 0 )
        {
            try
            {
                await mongoose.connection.close( true ); // Force close any outstanding operations
                this.isConnected = false;
                this.logger.info( 'Successfully disconnected from MongoDB' );
                this.emit( 'disconnected' );
            } catch ( error )
            {
                this.logger.error( 'Error during MongoDB disconnection', { error: ( error as Error ).message } );
                throw error;
            }
        } else
        {
            this.logger.info( 'MongoDB already disconnected' );
        }
    }
} 