#!/bin/bash

# Install dependencies
npm install

# Create build
npm run build

# Run tests
npm test

echo "Setup complete! You can now run the application with 'npm run dev'" 