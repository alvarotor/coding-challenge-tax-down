import { Customer } from '../entities/Customer';

export interface CustomerRepository
{
    findById ( id: string ): Promise<Customer | null>;
    findByEmail ( email: string ): Promise<Customer | null>;
    save ( customer: Customer ): Promise<Customer>;
    update ( id: string, data: Partial<Customer> ): Promise<Customer>;
    delete ( id: string ): Promise<void>;
    findAllSortedByCredit (): Promise<Customer[]>;
} 