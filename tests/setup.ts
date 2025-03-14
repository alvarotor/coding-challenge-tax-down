import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoMemoryServerOptsT } from 'mongodb-memory-server-core/lib/MongoMemoryServer';

// Set up Jest timers for testing
jest.setTimeout( 120000 ); // Increase timeout to 2 minutes

// Skip tests if MongoDB binary download fails
const mongoServerOptions: MongoMemoryServerOptsT = {
    instance: {
        dbName: 'jest-test-db',
    },
    binary: {
        checkMD5: false,
        downloadDir: './.cache/mongodb-binaries',
    },
};

// Mock MongoDB for all tests
jest.mock( 'mongoose', () =>
{
    const originalModule = jest.requireActual( 'mongoose' );
    return {
        ...originalModule,
        connect: jest.fn().mockResolvedValue( undefined ),
        connection: {
            ...originalModule.connection,
            readyState: 1,
        },
    };
} );

// Mock the CustomerModel
jest.mock( '../src/infrastructure/database/mongodb/customer.schema', () => ( {
    CustomerModel: {
        findById: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn().mockReturnValue( {
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue( [] ),
        } ),
        create: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue( undefined ),
    },
} ) );

// Skip actual MongoDB connection in tests
beforeAll( () =>
{
    console.log( 'Using mocked MongoDB connection for tests' );
    process.env.NODE_ENV = 'test';
} );

afterAll( () =>
{
    console.log( 'Test suite completed' );
} ); 