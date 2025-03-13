export interface Logger
{
    debug ( message: string, meta?: Record<string, any> ): void;
    info ( message: string, meta?: Record<string, any> ): void;
    warn ( message: string, meta?: Record<string, any> ): void;
    error ( message: string, error?: Error | Record<string, any> ): void;
} 