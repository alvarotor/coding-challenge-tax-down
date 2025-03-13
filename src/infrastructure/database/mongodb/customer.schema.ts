import mongoose, { Schema, Document } from 'mongoose';

export interface CustomerDocument extends Document
{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    availableCredit: number;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema: Schema = new Schema( {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    availableCredit: { type: Number, default: 0 },
}, {
    timestamps: true
} );

export const CustomerModel = mongoose.model<CustomerDocument>( 'Customer', CustomerSchema ); 