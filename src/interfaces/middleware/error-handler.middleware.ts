import { Request, Response, NextFunction } from 'express';
import { CustomerNotFoundError } from '../../application/errors/customer-not-found.error';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void =>
{
    if ( error instanceof CustomerNotFoundError )
    {
        res.status( 404 ).json( { error: error.message } );
        return;
    }

    if ( error.name === 'ValidationError' )
    {
        res.status( 400 ).json( { error: error.message } );
        return;
    }

    if ( error.name === 'MongoError' && ( error as any ).code === 11000 )
    {
        res.status( 409 ).json( { error: error.message } );
        return;
    }

    res.status( 500 ).json( { error: 'Internal server error' } );
}; 