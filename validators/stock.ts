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

    paymentProofImage: z.string().optional(), // Base64 string

    // New Lube Fields
    lubeCategory: z.string().optional(),
    unitVolume: z.coerce.number().optional(),
    lubeName: z.string().optional(),
    unitsQuantity: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
    if (data.fuelType === 'Lubricants') {
        if (!data.lubeCategory) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Lube category is required",
                path: ["lubeCategory"]
            });
        }
        if (!data.unitVolume) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Volume is required",
                path: ["unitVolume"]
            });
        }
        if (!data.lubeName) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Lube name/type is required",
                path: ["lubeName"]
            });
        }
        // If it's lubricant, quantity (liters) is calculated, but we might want to check unitsQuantity too if needed
        if (!data.unitsQuantity || data.unitsQuantity <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Quantity (Gallons) is required",
                path: ["unitsQuantity"] // We can map error to a field we add to form or just use quantity
            });
        }
    }
});

// Lubricant Constants
export const LUBE_CATEGORIES = ['Petrol', 'Diesel'] as const;

export const LUBE_VOLUMES = {
    'Petrol': [0.7, 1, 3, 4, 210],
    'Diesel': [4, 10, 210] // Defined as 4L and 10L in prompt
} as const;

export const LUBE_BRANDS = {
    'Petrol': {
        0.7: ['Blaze'],
        1: ['Carrient Plus', 'Blaze'],
        3: ['Carrient Plus', 'Ultra'],
        4: ['Carrient Plus', 'Ultra', 'S Pro'],
        210: ['Carrient Plus', 'Blaze', 'Ultra']
    },
    'Diesel': {
        4: ['Deo Max', 'Deo 3000', 'Deo 6000', 'Deo 8000'],
        10: ['Deo Max', 'Deo 3000', 'Deo 6000', 'Deo 8000'], // Assuming same for both as per "type same for both"
        210: ['Deo Max', 'Deo 3000', 'Deo 6000', 'Deo 8000']
    }
} as const;


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
