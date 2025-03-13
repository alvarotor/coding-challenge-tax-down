import { Customer } from '../../../domain/customer/customer.entity';
import { CustomerRepository } from '../../../domain/customer/customer.repository';
import { CustomerModel, CustomerDocument } from './customer.schema';
import { Logger } from '../../logging/logger';

export class MongoCustomerRepository implements CustomerRepository
{
    constructor( private readonly logger: Logger )
    {
    }

    async findAll ( sortBy: string = 'createdAt', order: 'asc' | 'desc' = 'desc' ): Promise<Customer[]>
    {
        this.logger.debug( 'Finding all customers', { sortBy, order } );

        try
        {
            const sortOrder = order === 'asc' ? 1 : -1;
            const documents = await CustomerModel.find().sort( { [ sortBy ]: sortOrder } );
            return documents.map( doc => this.documentToEntity( doc ) );
        } catch ( error )
        {
            this.logger.error( 'Failed to retrieve customers', { error: ( error as Error ).message } );
            return [];
        }
    }

    async findById ( id: string ): Promise<Customer | null>
    {
        this.logger.debug( 'Finding customer by ID', { id } );

        try
        {
            const customer = await CustomerModel.findById( id ).lean();
            if ( !customer ) return null;
            return new Customer(
                customer.firstName,
                customer.lastName,
                customer.email,
                customer.phone,
                customer.address,
                customer.availableCredit,
                customer._id.toString(),
                customer.createdAt,
                customer.updatedAt
            );
        } catch ( error )
        {
            this.logger.error( 'Error finding customer by ID', error as Error );
            throw error;
        }
    }

    async findByEmail ( email: string ): Promise<Customer | null>
    {
        this.logger.debug( 'Finding customer by email', { email } );

        const document = await CustomerModel.findOne( { email } );
        if ( !document ) return null;

        return this.documentToEntity( document );
    }

    async create ( customer: Customer ): Promise<Customer>
    {
        this.logger.debug( 'Creating customer', { id: customer.getId() } );

        const document = new CustomerModel( {
            _id: customer.getId(),
            firstName: customer.getFirstName(),
            lastName: customer.getLastName(),
            email: customer.getEmail(),
            phone: customer.getPhone(),
            address: customer.getAddress(),
            availableCredit: customer.getAvailableCredit(),
        } );

        const savedDocument = await document.save();
        return this.documentToEntity( savedDocument );
    }

    async update ( customer: Customer ): Promise<Customer>
    {
        this.logger.debug( 'Updating customer', { id: customer.getId() } );

        const updatedDocument = await CustomerModel.findByIdAndUpdate(
            customer.getId(),
            {
                firstName: customer.getFirstName(),
                lastName: customer.getLastName(),
                email: customer.getEmail(),
                phone: customer.getPhone(),
                address: customer.getAddress(),
                availableCredit: customer.getAvailableCredit(),
            },
            { new: true }
        );

        if ( !updatedDocument )
        {
            throw new Error( `Customer with id ${ customer.getId() } not found` );
        }

        return this.documentToEntity( updatedDocument );
    }

    async delete ( id: string ): Promise<boolean>
    {
        this.logger.debug( 'Deleting customer', { id } );

        const result = await CustomerModel.deleteOne( { _id: id } );
        return result.deletedCount === 1;
    }

    private documentToEntity ( document: CustomerDocument ): Customer
    {
        return new Customer(
            document.firstName,
            document.lastName,
            document.email,
            document.phone,
            document.address,
            document.availableCredit,
            document._id.toString(),
            document.createdAt,
            document.updatedAt
        );
    }
} 