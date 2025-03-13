import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class UseCreditUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute ( customerId: string, amount: number ): Promise<void>
    {
        this.logger.info( 'Using credit from customer', { customerId, amount } );

        // Find customer
        const customer = await this.customerRepository.findById( customerId );
        if ( !customer )
        {
            this.logger.error( 'Customer not found', { customerId } );
            throw new Error( 'Customer not found' );
        }

        try
        {
            // Use credit
            customer.useCredit( amount );

            // Save changes
            await this.customerRepository.update( customer );
            this.logger.info( 'Credit used successfully', {
                customerId,
                newCredit: customer.getAvailableCredit()
            } );
        } catch ( error )
        {
            this.logger.error( 'Error using credit', {
                customerId,
                amount,
                error: ( error as Error ).message
            } );
            throw error;
        }
    }
} 