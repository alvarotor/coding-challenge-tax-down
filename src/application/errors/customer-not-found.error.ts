export class CustomerNotFoundError extends Error
{
    constructor( customerId: string )
    {
        super( `Customer with id ${ customerId } not found` );
        this.name = 'CustomerNotFoundError';
    }
} 