# Motorbike Shop API

A RESTful API for customer management of an online motorbike shop, built with Node.js, TypeScript, and MongoDB.

## Features

- CRUD operations for customers
- Add credit to customer accounts
- List customers sorted by available credit
- Serverless deployment to AWS Lambda
- Comprehensive test suite

## Architecture

This project follows Hexagonal Architecture (Ports and Adapters) with Domain-Driven Design principles:

- **Domain Layer**: Contains the core business logic and entities
- **Application Layer**: Contains use cases that orchestrate the domain
- **Infrastructure Layer**: Contains implementations of repositories, logging, etc.
- **Interfaces Layer**: Contains API controllers and serverless handlers

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- AWS account (for serverless deployment)
- Serverless Framework CLI (for deployment)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/motorbike-shop-api.git
   cd motorbike-shop-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/motorbike-shop
   PORT=3000
   LOG_LEVEL=info
   ```

## Running Locally

Start the development server:

```
npm run dev
```

The API will be available at http://localhost:3000

## Testing

Run the test suite:

```
npm test
```

Run tests with coverage:

```
npm run test:coverage
```

## API Endpoints

### Customers

- `POST /api/customers` - Create a new customer
- `GET /api/customers/:id` - Get a customer by ID
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer
- `POST /api/customers/:id/credit` - Add credit to a customer
- `GET /api/customers` - Get customers sorted by credit
