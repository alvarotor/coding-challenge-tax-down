import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class AddCreditUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute ( customerId: string, amount: number ): Promise<void>
    {
        this.logger.info( 'Adding credit to customer', { customerId, amount } );

        // Find customer
        const customer = await this.customerRepository.findById( customerId );
        if ( !customer )
        {
            this.logger.error( 'Customer not found', { customerId } );
            throw new Error( 'Customer not found' );
        }

        // Add credit
        customer.addCredit( amount );

        // Save changes
        await this.customerRepository.update( customer );
        this.logger.info( 'Credit added successfully', {
            customerId,
            newCredit: customer.getAvailableCredit()
        } );
    }
} 