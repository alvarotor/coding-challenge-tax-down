import { Customer } from '../../domain/customer/customer.entity';
import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Logger } from '../../infrastructure/logging/logger';

export class GetCustomersSortedByCreditUseCase
{
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly logger: Logger
    ) { }

    async execute ( order: 'asc' | 'desc' = 'desc' ): Promise<Customer[]>
    {
        this.logger.info( 'Getting customers sorted by credit', { order } );

        const customers = await this.customerRepository.findAll( 'availableCredit', order );

        this.logger.info( 'Retrieved sorted customers', { count: customers.length } );
        return customers;
    }
} 