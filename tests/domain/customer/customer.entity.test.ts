import { Customer } from '../../../src/domain/customer/customer.entity';

// Mock the MongoDB setup for this test file
jest.mock( '../../../tests/setup', () => ( {
    // Empty implementation
} ) );

describe( 'Customer Entity', () =>
{
    let customer: Customer;

    beforeEach( () =>
    {
        customer = new Customer(
            'John',
            'Doe',
            'john.doe@example.com',
            '123-456-7890',
            '123 Main St, City',
            100
        );
    } );

    describe( 'Constructor', () =>
    {
        it( 'should create a customer with the provided values', () =>
        {
            expect( customer.getFirstName() ).toBe( 'John' );
            expect( customer.getLastName() ).toBe( 'Doe' );
            expect( customer.getEmail() ).toBe( 'john.doe@example.com' );
            expect( customer.getPhone() ).toBe( '123-456-7890' );
            expect( customer.getAddress() ).toBe( '123 Main St, City' );
            expect( customer.getAvailableCredit() ).toBe( 100 );
            expect( customer.getId() ).toBeDefined();
            expect( customer.getCreatedAt() ).toBeInstanceOf( Date );
            expect( customer.getUpdatedAt() ).toBeInstanceOf( Date );
        } );

        it( 'should create a customer with default credit of 0 when not provided', () =>
        {
            const customerWithoutCredit = new Customer(
                'Jane',
                'Smith',
                'jane.smith@example.com',
                '987-654-3210',
                '456 Oak St, Town'
            );

            expect( customerWithoutCredit.getAvailableCredit() ).toBe( 0 );
        } );
    } );

    describe( 'Credit Management', () =>
    {
        it( 'should add credit correctly', () =>
        {
            customer.addCredit( 50 );
            expect( customer.getAvailableCredit() ).toBe( 150 );
        } );

        it( 'should throw error when adding negative credit', () =>
        {
            expect( () => customer.addCredit( -50 ) ).toThrow( 'Credit amount must be positive' );
        } );

        it( 'should use credit correctly', () =>
        {
            customer.useCredit( 50 );
            expect( customer.getAvailableCredit() ).toBe( 50 );
        } );

        it( 'should throw error when using negative credit', () =>
        {
            expect( () => customer.useCredit( -50 ) ).toThrow( 'Credit amount must be positive' );
        } );

        it( 'should throw error when using more credit than available', () =>
        {
            expect( () => customer.useCredit( 150 ) ).toThrow( 'Insufficient credit' );
        } );
    } );

    describe( 'Update Methods', () =>
    {
        it( 'should update first name correctly', () =>
        {
            const originalUpdatedAt = customer.getUpdatedAt();
            // Wait to ensure timestamp difference
            jest.advanceTimersByTime( 1000 );

            customer.updateFirstName( 'James' );

            expect( customer.getFirstName() ).toBe( 'James' );
            expect( customer.getUpdatedAt().getTime() ).toBeGreaterThan( originalUpdatedAt.getTime() );
        } );

        it( 'should update email correctly', () =>
        {
            customer.updateEmail( 'james.doe@example.com' );
            expect( customer.getEmail() ).toBe( 'james.doe@example.com' );
        } );

        it( 'should throw error when updating with invalid email', () =>
        {
            expect( () => customer.updateEmail( 'invalid-email' ) ).toThrow( 'Invalid email format' );
        } );
    } );

    describe( 'Serialization', () =>
    {
        it( 'should serialize to JSON correctly', () =>
        {
            const json = customer.toJSON();

            expect( json ).toEqual( {
                id: customer.getId(),
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '123-456-7890',
                address: '123 Main St, City',
                availableCredit: 100,
                createdAt: customer.getCreatedAt(),
                updatedAt: customer.getUpdatedAt()
            } );
        } );
    } );
} ); 