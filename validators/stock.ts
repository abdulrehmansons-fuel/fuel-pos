import { z } from 'zod';

// Fuel type options
export const FUEL_TYPES = [
    'Petrol',
    'Diesel',
    'High-Octane',
    'Engine Oil',
    'Lubricants'
] as const;

// Payment type options
export const PAYMENT_TYPES = [
    'Cash',
    'Bank Transfer',
    'Credit'
] as const;

// Base stock schema for add form
export const stockAddSchema = z.object({
    fuelType: z.enum(FUEL_TYPES, {
        required_error: 'Fuel type is required',
        invalid_type_error: 'Please select a valid fuel type'
    }),

    quantity: z.string()
        .min(1, 'Quantity is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Quantity must be a positive number'
        }),

    purchasePricePerLiter: z.string()
        .min(1, 'Purchase price per liter is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Purchase price per liter must be a positive number'
        }),

    salePricePerLiter: z.string()
        .min(1, 'Sale price per liter is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Sale price per liter must be a positive number'
        }),

    purchaseDate: z.string()
        .min(1, 'Purchase date is required')
        .refine((date) => {
            const selectedDate = new Date(date);
            return !isNaN(selectedDate.getTime());
        }, 'Please enter a valid date'),

    supplier: z.string()
        .max(200, 'Supplier name must be less than 200 characters')
        .optional(),

    paymentType: z.enum(PAYMENT_TYPES, {
        invalid_type_error: 'Please select a valid payment type'
    }).optional(),

    pump: z.string().min(1, "Pump is required"),

    notes: z.string().optional(),
});

// Edit stock schema (same as add for now)
export const stockEditSchema = stockAddSchema;

// Type inference
export type StockAddFormData = z.infer<typeof stockAddSchema>;
export type StockEditFormData = z.infer<typeof stockEditSchema>;

// Validation helper functions
export const validateStockAdd = (data: unknown) => {
    try {
        return {
            success: true,
            data: stockAddSchema.parse(data),
            errors: null
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                data: null,
                errors: error.flatten().fieldErrors
            };
        }
        throw error;
    }
};

export const validateStockEdit = (data: unknown) => {
    try {
        return {
            success: true,
            data: stockEditSchema.parse(data),
            errors: null
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                data: null,
                errors: error.flatten().fieldErrors
            };
        }
        throw error;
    }
};
