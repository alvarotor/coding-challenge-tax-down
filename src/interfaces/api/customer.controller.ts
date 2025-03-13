import { Request, Response } from 'express';
import { CreateCustomerUseCase } from '../../application/customer/create-customer.use-case';
import { GetCustomerUseCase } from '../../application/customer/get-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/customer/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../application/customer/delete-customer.use-case';
import { AddCreditUseCase } from '../../application/customer/add-credit.use-case';
import { GetCustomersSortedByCreditUseCase } from '../../application/customer/get-customers-sorted-by-credit.use-case';
import { Logger } from '../../infrastructure/logging/logger';
import { validateCustomer } from './validators/customer.validator';

export class CustomerController
{
    constructor(
        private readonly createCustomerUseCase: CreateCustomerUseCase,
        private readonly getCustomerUseCase: GetCustomerUseCase,
        private readonly updateCustomerUseCase: UpdateCustomerUseCase,
        private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
        private readonly addCreditUseCase: AddCreditUseCase,
        private readonly getCustomersSortedByCreditUseCase: GetCustomersSortedByCreditUseCase,
        private readonly logger: Logger
    ) { }

    async createCustomer ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const { error, value } = validateCustomer( req.body );
            if ( error )
            {
                res.status( 400 ).json( { error: error.details[ 0 ].message } );
                return;
            }

            const { firstName, lastName, email, phone, address, availableCredit } = value;
            const customer = await this.createCustomerUseCase.execute(
                firstName, lastName, email, phone, address, availableCredit
            );

            res.status( 201 ).json( customer );
        } catch ( error: unknown )
        {
            const err = error as Error;
            this.logger.error( 'Error creating customer', { error: err.message } );
            res.status( err.message.includes( 'already exists' ) ? 409 : 500 )
                .json( { error: err.message } );
        }
    }

    async getCustomer ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const { id } = req.params;
            const customer = await this.getCustomerUseCase.execute( id );

            if ( !customer )
            {
                res.status( 404 ).json( { error: 'Customer not found' } );
                return;
            }

            res.status( 200 ).json( customer );
        } catch ( error: unknown )
        {
            const err = error as Error;
            this.logger.error( 'Error getting customer', { error: err.message } );
            res.status( 500 ).json( { error: err.message } );
        }
    }

    async updateCustomer ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const { id } = req.params;
            const { error, value } = validateCustomer( req.body );

            if ( error )
            {
                res.status( 400 ).json( { error: error.details[ 0 ].message } );
                return;
            }

            const { firstName, lastName, email, phone, address } = value;
            const customer = await this.updateCustomerUseCase.execute(
                id, firstName, lastName, email, phone, address
            );

            res.status( 200 ).json( customer );
        } catch ( error: unknown )
        {
            const err = error as Error;
            this.logger.error( 'Error updating customer', { error: err.message } );
            res.status( err.message.includes( 'not found' ) ? 404 : 500 )
                .json( { error: err.message } );
        }
    }

    async deleteCustomer ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const { id } = req.params;
            const success = await this.deleteCustomerUseCase.execute( id );

            if ( !success )
            {
                res.status( 404 ).json( { error: 'Customer not found' } );
                return;
            }

            res.status( 204 ).send();
        } catch ( error: unknown )
        {
            const err = error as Error;
            this.logger.error( 'Error deleting customer', { error: err.message } );
            res.status( 500 ).json( { error: err.message } );
        }
    }

    async addCredit ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const { id } = req.params;
            const { amount } = req.body;

            if ( typeof amount !== 'number' || amount <= 0 )
            {
                res.status( 400 ).json( { error: 'Amount must be a positive number' } );
                return;
            }

            await this.addCreditUseCase.execute( id, amount );
            res.status( 200 ).json( { message: 'Credit added successfully' } );
        } catch ( error: unknown )
        {
            const err = error as Error;
            this.logger.error( 'Error adding credit', { error: err.message } );
            res.status( err.message.includes( 'not found' ) ? 404 : 500 )
                .json( { error: err.message } );
        }
    }

    async getCustomersSortedByCredit ( req: Request, res: Response ): Promise<void>
    {
        try
        {
            const order = req.query.order === 'asc' ? 'asc' : 'desc';
            const customers = await this.getCustomersSortedByCreditUseCase.execute( order );

            res.status( 200 ).json( customers );
        } catch ( error: unknown )
        {
            const err = error as Error;
            this.logger.error( 'Error getting customers sorted by credit', { error: err.message } );
            res.status( 500 ).json( { error: err.message } );
        }
    }
} 