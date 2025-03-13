import { Customer } from '../../domain/customer/customer.entity';
import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class UpdateCustomerUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute (
        id: string,
        firstName: string,
        lastName: string,
        email: string,
        phone: string,
        address: string
    ): Promise<Customer>
    {
        this.logger.info( 'Updating customer', { id } );

        // Find customer
        const customer = await this.customerRepository.findById( id );
        if ( !customer )
        {
            this.logger.error( 'Customer not found', { id } );
            throw new Error( 'Customer not found' );
        }

        // Check if email is being changed and if it's already in use
        if ( email !== customer.getEmail() )
        {
            const existingCustomer = await this.customerRepository.findByEmail( email );
            if ( existingCustomer && existingCustomer.getId() !== id )
            {
                this.logger.error( 'Email already in use by another customer', { email } );
                throw new Error( 'Email already in use by another customer' );
            }
        }

        // Update customer
        customer.updateFirstName( firstName );
        customer.updateLastName( lastName );
        customer.updateEmail( email );
        customer.updatePhone( phone );
        customer.updateAddress( address );

        // Save changes
        const updatedCustomer = await this.customerRepository.update( customer );
        this.logger.info( 'Customer updated successfully', { id } );

        return updatedCustomer;
    }
} 