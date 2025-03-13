import { v4 as uuidv4 } from 'uuid';

export class Customer
{
    private readonly id: string;
    private firstName: string;
    private lastName: string;
    private email: string;
    private phone: string;
    private address: string;
    private availableCredit: number;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        firstName: string,
        lastName: string,
        email: string,
        phone: string,
        address: string,
        availableCredit: number = 0,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date
    )
    {
        this.id = id || uuidv4();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.availableCredit = availableCredit;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    // Getters
    getId (): string
    {
        return this.id;
    }

    getFirstName (): string
    {
        return this.firstName;
    }

    getLastName (): string
    {
        return this.lastName;
    }

    getEmail (): string
    {
        return this.email;
    }

    getPhone (): string
    {
        return this.phone;
    }

    getAddress (): string
    {
        return this.address;
    }

    getAvailableCredit (): number
    {
        return this.availableCredit;
    }

    getCreatedAt (): Date
    {
        return this.createdAt;
    }

    getUpdatedAt (): Date
    {
        return this.updatedAt;
    }

    // Setters with validation
    updateFirstName ( firstName: string ): void
    {
        this.firstName = firstName;
        this.updateTimestamp();
    }

    updateLastName ( lastName: string ): void
    {
        this.lastName = lastName;
        this.updateTimestamp();
    }

    updateEmail ( email: string ): void
    {
        // Simple email validation
        if ( !email.includes( '@' ) )
        {
            throw new Error( 'Invalid email format' );
        }
        this.email = email;
        this.updateTimestamp();
    }

    updatePhone ( phone: string ): void
    {
        this.phone = phone;
        this.updateTimestamp();
    }

    updateAddress ( address: string ): void
    {
        this.address = address;
        this.updateTimestamp();
    }

    // Business logic
    addCredit ( amount: number ): void
    {
        if ( amount <= 0 )
        {
            throw new Error( 'Credit amount must be positive' );
        }
        this.availableCredit += amount;
        this.updateTimestamp();
    }

    useCredit ( amount: number ): void
    {
        if ( amount <= 0 )
        {
            throw new Error( 'Credit amount must be positive' );
        }
        if ( this.availableCredit < amount )
        {
            throw new Error( 'Insufficient credit' );
        }
        this.availableCredit -= amount;
        this.updateTimestamp();
    }

    private updateTimestamp (): void
    {
        this.updatedAt = new Date();
    }

    // For serialization
    toJSON ()
    {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            address: this.address,
            availableCredit: this.availableCredit,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
} 