import { Customer } from '../../domain/customer/customer.entity';
import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class CreateCustomerUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute (
        firstName: string,
        lastName: string,
        email: string,
        phone: string,
        address: string,
        availableCredit: number = 0
    ): Promise<Customer>
    {
        this.logger.info( 'Creating new customer', { email } );

        // Check if customer with email already exists
        const existingCustomer = await this.customerRepository.findByEmail( email );
        if ( existingCustomer )
        {
            this.logger.error( 'Customer with this email already exists', { email } );
            throw new Error( 'Customer with this email already exists' );
        }

        // Create new customer
        const customer = new Customer(
            firstName,
            lastName,
            email,
            phone,
            address,
            availableCredit
        );

        // Save to repository
        const savedCustomer = await this.customerRepository.create( customer );
        this.logger.info( 'Customer created successfully', { id: savedCustomer.getId() } );

        return savedCustomer;
    }
} 