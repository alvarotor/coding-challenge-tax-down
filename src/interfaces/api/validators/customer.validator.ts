import Joi from 'joi';

const customerSchema = Joi.object( {
    firstName: Joi.string().required().min( 2 ).max( 50 ),
    lastName: Joi.string().required().min( 2 ).max( 50 ),
    email: Joi.string().email().required(),
    phone: Joi.string().required().min( 5 ).max( 20 ),
    address: Joi.string().required().min( 5 ).max( 200 ),
    availableCredit: Joi.number().min( 0 ).default( 0 )
} );

export const validateCustomer = ( data: any ) =>
{
    return customerSchema.validate( data );
}; 