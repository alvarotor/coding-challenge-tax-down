import { App } from './infrastructure/config/app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create and start the application
const app = new App();
app.start()
    .catch( error =>
    {
        console.error( 'Failed to start application:', error );
        process.exit( 1 );
    } ); 