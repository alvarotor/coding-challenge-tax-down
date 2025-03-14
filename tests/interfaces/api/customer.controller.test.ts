import { Request, Response } from 'express';
import { CustomerController } from '../../../src/interfaces/api/customer.controller';
import { CreateCustomerUseCase } from '../../../src/application/customer/create-customer.use-case';
import { GetCustomerUseCase } from '../../../src/application/customer/get-customer.use-case';
import { UpdateCustomerUseCase } from '../../../src/application/customer/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../../src/application/customer/delete-customer.use-case';
import { AddCreditUseCase } from '../../../src/application/customer/add-credit.use-case';
import { GetCustomersSortedByCreditUseCase } from '../../../src/application/customer/get-customers-sorted-by-credit.use-case';
import { Customer } from '../../../src/domain/customer/customer.entity';
import { Logger } from '../../../src/infrastructure/logging/logger';

// Mock the MongoDB setup for this test file
jest.mock( '../../../tests/setup', () => ( {
    // Empty implementation
} ) );

describe( 'CustomerController', () =>
{
    let customerController: CustomerController;
    let mockCreateCustomerUseCase: jest.Mocked<CreateCustomerUseCase>;
    let mockGetCustomerUseCase: jest.Mocked<GetCustomerUseCase>;
    let mockUpdateCustomerUseCase: jest.Mocked<UpdateCustomerUseCase>;
    let mockDeleteCustomerUseCase: jest.Mocked<DeleteCustomerUseCase>;
    let mockAddCreditUseCase: jest.Mocked<AddCreditUseCase>;
    let mockGetCustomersSortedByCreditUseCase: jest.Mocked<GetCustomersSortedByCreditUseCase>;
    let mockLogger: jest.Mocked<Logger>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach( () =>
    {
        // Mock all use cases
        mockCreateCustomerUseCase = { execute: jest.fn() } as unknown as jest.Mocked<CreateCustomerUseCase>;
        mockGetCustomerUseCase = { execute: jest.fn() } as unknown as jest.Mocked<GetCustomerUseCase>;
        mockUpdateCustomerUseCase = { execute: jest.fn() } as unknown as jest.Mocked<UpdateCustomerUseCase>;
        mockDeleteCustomerUseCase = { execute: jest.fn() } as unknown as jest.Mocked<DeleteCustomerUseCase>;
        mockAddCreditUseCase = { execute: jest.fn() } as unknown as jest.Mocked<AddCreditUseCase>;
        mockGetCustomersSortedByCreditUseCase = { execute: jest.fn() } as unknown as jest.Mocked<GetCustomersSortedByCreditUseCase>;

        // Mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as jest.Mocked<Logger>;

        // Create controller with mocked dependencies
        customerController = new CustomerController(
            mockCreateCustomerUseCase,
            mockGetCustomerUseCase,
            mockUpdateCustomerUseCase,
            mockDeleteCustomerUseCase,
            mockAddCreditUseCase,
            mockGetCustomersSortedByCreditUseCase,
            mockLogger
        );

        // Mock Express request and response
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
    } );

    describe( 'createCustomer', () =>
    {
        it( 'should create a customer successfully', async () =>
        {
            // Arrange
            const customerData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '123-456-7890',
                address: '123 Main St, City',
                availableCredit: 100
            };

            mockRequest.body = customerData;

            const mockCustomer = new Customer(
                customerData.firstName,
                customerData.lastName,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.availableCredit
            );

            mockCreateCustomerUseCase.execute.mockResolvedValue( mockCustomer );

            // Act
            await customerController.createCustomer( mockRequest as Request, mockResponse as Response );

            // Assert
            expect( mockCreateCustomerUseCase.execute ).toHaveBeenCalledWith(
                customerData.firstName,
                customerData.lastName,
                customerData.email,
                customerData.phone,
                customerData.address,
                customerData.availableCredit
            );
            expect( mockResponse.status ).toHaveBeenCalledWith( 201 );
            expect( mockResponse.json ).toHaveBeenCalledWith( mockCustomer );
        } );

        it( 'should return 400 when validation fails', async () =>
        {
            // Arrange
            mockRequest.body = {
                // Missing required fields
                firstName: 'John'
            };

            // Act
            await customerController.createCustomer( mockRequest as Request, mockResponse as Response );

            // Assert
            expect( mockCreateCustomerUseCase.execute ).not.toHaveBeenCalled();
            expect( mockResponse.status ).toHaveBeenCalledWith( 400 );
            expect( mockResponse.json ).toHaveBeenCalledWith( expect.objectContaining( {
                error: expect.any( String )
            } ) );
        } );

        it( 'should return 409 when customer with email already exists', async () =>
        {
            // Arrange
            const customerData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '123-456-7890',
                address: '123 Main St, City'
            };

            mockRequest.body = customerData;

            mockCreateCustomerUseCase.execute.mockRejectedValue(
                new Error( 'Customer with this email already exists' )
            );

            // Act
            await customerController.createCustomer( mockRequest as Request, mockResponse as Response );

            // Assert
            expect( mockResponse.status ).toHaveBeenCalledWith( 409 );
            expect( mockResponse.json ).toHaveBeenCalledWith( {
                error: 'Customer with this email already exists'
            } );
        } );
    } );

    describe( 'addCredit', () =>
    {
        it( 'should add credit successfully', async () =>
        {
            // Arrange
            mockRequest.params = { id: 'customer-123' };
            mockRequest.body = { amount: 50 };

            // Act
            await customerController.addCredit( mockRequest as Request, mockResponse as Response );

            // Assert
            expect( mockAddCreditUseCase.execute ).toHaveBeenCalledWith( 'customer-123', 50 );
            expect( mockResponse.status ).toHaveBeenCalledWith( 200 );
            expect( mockResponse.json ).toHaveBeenCalledWith( {
                message: 'Credit added successfully'
            } );
        } );

        it( 'should return 400 when amount is not positive', async () =>
        {
            // Arrange
            mockRequest.params = { id: 'customer-123' };
            mockRequest.body = { amount: -50 };

            // Act
            await customerController.addCredit( mockRequest as Request, mockResponse as Response );

            // Assert
            expect( mockAddCreditUseCase.execute ).not.toHaveBeenCalled();
            expect( mockResponse.status ).toHaveBeenCalledWith( 400 );
            expect( mockResponse.json ).toHaveBeenCalledWith( {
                error: 'Amount must be a positive number'
            } );
        } );

        it( 'should return 404 when customer is not found', async () =>
        {
            // Arrange
            mockRequest.params = { id: 'non-existent-id' };
            mockRequest.body = { amount: 50 };

            mockAddCreditUseCase.execute.mockRejectedValue(
                new Error( 'Customer not found' )
            );

            // Act
            await customerController.addCredit( mockRequest as Request, mockResponse as Response );

            // Assert
            expect( mockResponse.status ).toHaveBeenCalledWith( 404 );
            expect( mockResponse.json ).toHaveBeenCalledWith( {
                error: 'Customer not found'
            } );
        } );
    } );
} ); 