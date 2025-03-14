import { createClient, RedisClientType } from 'redis';
import { CacheService } from './cache.service';
import { Logger } from '../logging/logger';

export class RedisCacheService implements CacheService
{
    private client: RedisClientType;
    private readonly defaultTtl: number;
    private isConnected: boolean = false;

    constructor(
        private readonly logger: Logger,
        redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379',
        defaultTtl: number = 3600 // 1 hour default
    )
    {
        this.defaultTtl = defaultTtl;
        this.client = createClient( { url: redisUrl } );

        this.client.on( 'error', ( err ) =>
        {
            this.logger.error( 'Redis client error', { error: err.message } );
            this.isConnected = false;
        } );

        this.client.on( 'connect', () =>
        {
            this.logger.info( 'Redis client connected' );
            this.isConnected = true;
        } );

        this.connect();
    }

    private async connect (): Promise<void>
    {
        try
        {
            await this.client.connect();
            this.logger.info( 'Connected to Redis' );
        } catch ( error )
        {
            this.logger.error( 'Failed to connect to Redis', { error: ( error as Error ).message } );
        }
    }

    async get<T> ( key: string ): Promise<T | null>
    {
        if ( !this.isConnected ) return null;

        try
        {
            const value = await this.client.get( key );
            if ( !value ) return null;
            return JSON.parse( value ) as T;
        } catch ( error )
        {
            this.logger.error( 'Cache get error', { key, error: ( error as Error ).message } );
            return null;
        }
    }

    async set<T> ( key: string, value: T, ttlSeconds?: number ): Promise<void>
    {
        if ( !this.isConnected ) return;

        try
        {
            const ttl = ttlSeconds || this.defaultTtl;
            await this.client.set( key, JSON.stringify( value ), { EX: ttl } );
        } catch ( error )
        {
            this.logger.error( 'Cache set error', { key, error: ( error as Error ).message } );
        }
    }

    async del ( key: string ): Promise<void>
    {
        if ( !this.isConnected ) return;

        try
        {
            await this.client.del( key );
        } catch ( error )
        {
            this.logger.error( 'Cache delete error', { key, error: ( error as Error ).message } );
        }
    }

    async flush (): Promise<void>
    {
        if ( !this.isConnected ) return;

        try
        {
            await this.client.flushAll();
            this.logger.info( 'Cache flushed' );
        } catch ( error )
        {
            this.logger.error( 'Cache flush error', { error: ( error as Error ).message } );
        }
    }

    async shutdown (): Promise<void>
    {
        if ( this.isConnected )
        {
            await this.client.quit();
            this.isConnected = false;
            this.logger.info( 'Redis connection closed' );
        }
    }
} 