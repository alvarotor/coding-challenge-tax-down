import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { CustomerNotFoundError } from '../errors/CustomerNotFoundError';
import { EmailAlreadyInUseError } from '../errors/EmailAlreadyInUseError';

interface UpdateCustomerDTO
{
    name?: string;
    email?: string;
    phone?: string;
}

export class UpdateCustomerUseCase
{
    constructor( private customerRepository: CustomerRepository ) { }

    async execute ( customerId: string, data: UpdateCustomerDTO ): Promise<Customer>
    {
        const customer = await this.customerRepository.findById( customerId );
        if ( !customer )
        {
            throw new CustomerNotFoundError( customerId );
        }

        if ( data.email )
        {
            const existingCustomer = await this.customerRepository.findByEmail( data.email );
            if ( existingCustomer && existingCustomer.id !== customerId )
            {
                throw new EmailAlreadyInUseError( data.email );
            }
        }

        return this.customerRepository.update( customerId, data );
    }
} 