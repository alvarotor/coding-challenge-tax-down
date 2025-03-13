import { Customer } from '../../domain/customer/customer.entity';
import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class GetCustomerUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute ( id: string ): Promise<Customer | null>
    {
        this.logger.info( 'Getting customer by ID', { id } );

        const customer = await this.customerRepository.findById( id );

        if ( !customer )
        {
            this.logger.warn( 'Customer not found', { id } );
            return null;
        }

        this.logger.info( 'Customer found', { id } );
        return customer;
    }
} 