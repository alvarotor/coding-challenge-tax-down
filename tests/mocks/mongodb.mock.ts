// Mock MongoDB for unit tests
export const mockMongoDb = {
    connect: jest.fn().mockResolvedValue( undefined ),
    disconnect: jest.fn().mockResolvedValue( undefined ),
};

// Mock mongoose methods
jest.mock( 'mongoose', () => ( {
    connect: jest.fn().mockResolvedValue( undefined ),
    disconnect: jest.fn().mockResolvedValue( undefined ),
    connection: {
        readyState: 1,
    },
    Schema: jest.fn().mockImplementation( () => ( {
        index: jest.fn().mockReturnThis(),
    } ) ),
    model: jest.fn().mockReturnValue( {
        findById: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn().mockReturnValue( {
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
        } ),
        create: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue( undefined ),
    } ),
} ) ); 