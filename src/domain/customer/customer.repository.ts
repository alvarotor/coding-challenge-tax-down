import { Customer } from './customer.entity';

export interface CustomerRepository
{
    findAll ( sortBy?: string, order?: 'asc' | 'desc' ): Promise<Customer[]>;
    findById ( id: string ): Promise<Customer | null>;
    findByEmail ( email: string ): Promise<Customer | null>;
    create ( customer: Customer ): Promise<Customer>;
    update ( customer: Customer ): Promise<Customer>;
    delete ( id: string ): Promise<boolean>;
} 