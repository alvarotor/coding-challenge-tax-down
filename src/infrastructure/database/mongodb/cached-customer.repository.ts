import { Customer } from '../../../domain/customer/customer.entity';
import { CustomerRepository } from '../../../domain/customer/customer.repository';
import { CacheService } from '../../cache/cache.service';
import { Logger } from '../../logging/logger';

export class CachedCustomerRepository implements CustomerRepository
{
    private readonly customerCachePrefix = 'customer:';
    private readonly allCustomersCacheKey = 'customers:all';
    private readonly sortedCustomersCacheKey = 'customers:sorted';

    constructor(
        private readonly repository: CustomerRepository,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
        private readonly ttl: number = 3600 // 1 hour default
    ) { }

    async findAll ( sortBy: string = 'createdAt', order: 'asc' | 'desc' = 'desc' ): Promise<Customer[]>
    {
        const cacheKey = `${ this.sortedCustomersCacheKey }:${ sortBy }:${ order }`;

        try
        {
            // Try to get from cache first
            const cached = await this.cacheService.get<Customer[]>( cacheKey );
            if ( cached )
            {
                this.logger.debug( 'Cache hit for sorted customers', { sortBy, order } );
                return cached.map( this.deserializeCustomer );
            }
        } catch ( error )
        {
            this.logger.error( 'Error fetching customers from cache', { error: ( error as Error ).message } );
        }

        // Cache miss, get from repository
        const customers = await this.repository.findAll( sortBy, order );

        // Store in cache
        await this.cacheService.set( cacheKey, customers, this.ttl );
        this.logger.debug( 'Stored sorted customers in cache', { count: customers.length } );

        return customers;
    }

    async findById ( id: string ): Promise<Customer | null>
    {
        const cacheKey = `${ this.customerCachePrefix }${ id }`;

        try
        {
            // Try to get from cache first
            const cached = await this.cacheService.get<Customer>( cacheKey );
            if ( cached )
            {
                this.logger.debug( 'Cache hit for customer', { id } );
                return this.deserializeCustomer( cached );
            }
        } catch ( error )
        {
            this.logger.error( 'Error fetching customer from cache', { id, error: ( error as Error ).message } );
        }

        // Cache miss, get from repository
        const customer = await this.repository.findById( id );

        // Store in cache if found
        if ( customer )
        {
            await this.cacheService.set( cacheKey, customer, this.ttl );
            this.logger.debug( 'Stored customer in cache', { id } );
        }

        return customer;
    }

    async findByEmail ( email: string ): Promise<Customer | null>
    {
        // Email lookups are less frequent, so we directly call the repository
        // We could also cache by email if this becomes a bottleneck
        return this.repository.findByEmail( email );
    }

    async create ( customer: Customer ): Promise<Customer>
    {
        const result = await this.repository.create( customer );

        // Invalidate collections that include customers
        await this.invalidateCollections();

        // Cache the new customer
        const cacheKey = `${ this.customerCachePrefix }${ result.getId() }`;
        await this.cacheService.set( cacheKey, result, this.ttl );

        return result;
    }

    async update ( customer: Customer ): Promise<Customer>
    {
        const result = await this.repository.update( customer );

        // Update the cache for this specific customer
        const cacheKey = `${ this.customerCachePrefix }${ customer.getId() }`;
        await this.cacheService.set( cacheKey, result, this.ttl );

        // Invalidate collections that include customers
        await this.invalidateCollections();

        return result;
    }

    async delete ( id: string ): Promise<boolean>
    {
        const result = await this.repository.delete( id );

        if ( result )
        {
            // Remove from cache
            const cacheKey = `${ this.customerCachePrefix }${ id }`;
            await this.cacheService.del( cacheKey );

            // Invalidate collections that include customers
            await this.invalidateCollections();
        }

        return result;
    }

    private async invalidateCollections (): Promise<void>
    {
        // Clear sorted collections from cache - could be more granular
        await this.cacheService.del( this.allCustomersCacheKey );
        await this.cacheService.del( `${ this.sortedCustomersCacheKey }:availableCredit:asc` );
        await this.cacheService.del( `${ this.sortedCustomersCacheKey }:availableCredit:desc` );

        this.logger.debug( 'Invalidated customer collections in cache' );
    }

    private deserializeCustomer ( data: any ): Customer
    {
        // Handle deserialization from cache to ensure we have proper Customer instances
        if ( data instanceof Customer ) return data;

        return new Customer(
            data.firstName,
            data.lastName,
            data.email,
            data.phone,
            data.address,
            data.availableCredit,
            data.id,
            new Date( data.createdAt ),
            new Date( data.updatedAt )
        );
    }
} 