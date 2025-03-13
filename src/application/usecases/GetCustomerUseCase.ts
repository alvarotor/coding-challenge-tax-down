import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { CustomerNotFoundError } from '../errors/CustomerNotFoundError';

export class GetCustomerUseCase
{
    constructor( private customerRepository: CustomerRepository ) { }

    async execute ( customerId: string ): Promise<Customer>
    {
        const customer = await this.customerRepository.findById( customerId );

        if ( !customer )
        {
            throw new CustomerNotFoundError( customerId );
        }

        return customer;
    }
} 