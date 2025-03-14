import { AddCreditUseCase } from '../../../src/application/customer/add-credit.use-case';
import { Customer } from '../../../src/domain/customer/customer.entity';
import { CustomerRepository } from '../../../src/domain/customer/customer.repository';
import { Logger } from '../../../src/infrastructure/logging/logger';

// Mock the MongoDB setup for this test file
jest.mock( '../../../tests/setup', () => ( {
    // Empty implementation
} ) );

describe( 'AddCreditUseCase', () =>
{
    let addCreditUseCase: AddCreditUseCase;
    let mockCustomerRepository: jest.Mocked<CustomerRepository>;
    let mockLogger: jest.Mocked<Logger>;
    let mockCustomer: Customer;

    beforeEach( () =>
    {
        mockCustomer = new Customer(
            'John',
            'Doe',
            'john.doe@example.com',
            '123-456-7890',
            '123 Main St, City',
            100
        );

        // Mock the repository
        mockCustomerRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as jest.Mocked<CustomerRepository>;

        // Mock the logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as jest.Mocked<Logger>;

        // Create the use case with mocked dependencies
        addCreditUseCase = new AddCreditUseCase( mockCustomerRepository, mockLogger );
    } );

    it( 'should add credit to a customer successfully', async () =>
    {
        // Arrange
        const customerId = 'customer-123';
        const creditAmount = 50;

        // Mock the repository to return our test customer
        mockCustomerRepository.findById.mockResolvedValue( mockCustomer );
        mockCustomerRepository.update.mockResolvedValue( mockCustomer );

        // Act
        await addCreditUseCase.execute( customerId, creditAmount );

        // Assert
        expect( mockCustomerRepository.findById ).toHaveBeenCalledWith( customerId );
        expect( mockCustomer.getAvailableCredit() ).toBe( 150 ); // 100 initial + 50 added
        expect( mockCustomerRepository.update ).toHaveBeenCalledWith( mockCustomer );
        expect( mockLogger.info ).toHaveBeenCalledWith( 'Adding credit to customer', { customerId, amount: creditAmount } );
        expect( mockLogger.info ).toHaveBeenCalledWith( 'Credit added successfully', {
            customerId,
            newCredit: 150
        } );
    } );

    it( 'should throw an error when customer is not found', async () =>
    {
        // Arrange
        const customerId = 'non-existent-id';
        const creditAmount = 50;

        // Mock the repository to return null (customer not found)
        mockCustomerRepository.findById.mockResolvedValue( null );

        // Act & Assert
        await expect( addCreditUseCase.execute( customerId, creditAmount ) )
            .rejects
            .toThrow( 'Customer not found' );

        expect( mockCustomerRepository.findById ).toHaveBeenCalledWith( customerId );
        expect( mockLogger.error ).toHaveBeenCalledWith( 'Customer not found', { customerId } );
        expect( mockCustomerRepository.update ).not.toHaveBeenCalled();
    } );
} ); 