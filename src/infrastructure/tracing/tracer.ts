import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Logger } from '../logging/logger';

export class TracingService
{
    private sdk: NodeSDK;

    constructor( private readonly logger: Logger )
    {
        const traceExporter = new OTLPTraceExporter( {
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        } );

        this.sdk = new NodeSDK( {
            resource: new Resource( {
                [ SemanticResourceAttributes.SERVICE_NAME ]: 'motorbike-shop-api',
                [ SemanticResourceAttributes.SERVICE_VERSION ]: process.env.npm_package_version || '1.0.0',
                [ SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT ]: process.env.NODE_ENV || 'development',
            } ),
            traceExporter,
            instrumentations: [ getNodeAutoInstrumentations() ],
        } );
    }

    start (): void
    {
        try
        {
            this.sdk.start();
            this.logger.info( 'OpenTelemetry tracing initialized' );
        } catch ( error )
        {
            this.logger.error( 'Failed to initialize OpenTelemetry tracing', {
                error: ( error as Error ).message
            } );
        }
    }

    shutdown (): Promise<void>
    {
        return this.sdk.shutdown();
    }
} 