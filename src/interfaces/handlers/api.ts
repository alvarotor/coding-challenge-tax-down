import serverless from 'serverless-http';
import { App } from '../../infrastructure/config/app';

const app = new App();
app.connectToDatabase();

export const handler = serverless( app.getServer() ); 