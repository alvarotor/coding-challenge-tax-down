import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class DeleteCustomerUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute ( id: string ): Promise<boolean>
    {
        this.logger.info( 'Deleting customer', { id } );

        // Check if customer exists
        const customer = await this.customerRepository.findById( id );
        if ( !customer )
        {
            this.logger.warn( 'Customer not found for deletion', { id } );
            return false;
        }

        // Delete customer
        const result = await this.customerRepository.delete( id );

        if ( result )
        {
            this.logger.info( 'Customer deleted successfully', { id } );
        } else
        {
            this.logger.error( 'Failed to delete customer', { id } );
        }

        return result;
    }
} 