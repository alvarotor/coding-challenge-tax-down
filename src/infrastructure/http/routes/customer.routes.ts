import { Router } from 'express';
import { CustomerController } from '../../../interfaces/api/customer.controller';

export const customerRouter = ( customerController: CustomerController ): Router =>
{
    const router = Router();

    // CRUD operations
    router.post( '/', customerController.createCustomer.bind( customerController ) );
    router.get( '/:id', customerController.getCustomer.bind( customerController ) );
    router.put( '/:id', customerController.updateCustomer.bind( customerController ) );
    router.delete( '/:id', customerController.deleteCustomer.bind( customerController ) );

    // Add credit
    router.post( '/:id/credit', customerController.addCredit.bind( customerController ) );

    // Get customers sorted by credit
    router.get( '/', customerController.getCustomersSortedByCredit.bind( customerController ) );

    return router;
}; 