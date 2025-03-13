export class Customer
{
    public id?: string;
    public credit: number = 0;
    public createdAt: Date = new Date();
    public updatedAt: Date = new Date();

    constructor(
        public name: string,
        public email: string,
        public phone: string
    ) { }

    updateCredit ( amount: number ): void
    {
        this.credit = amount;
        this.updatedAt = new Date();
    }
} 