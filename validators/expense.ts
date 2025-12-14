import { z } from 'zod';

// Expense type options
export const EXPENSE_TYPES = [
    'Fuel Purchase',
    'Salary Paid',
    'Maintenance',
    'Utility Bills',
    'Cash Withdrawal',
    'Miscellaneous',
    'Other'
] as const;

// Fuel pump options
export const FUEL_PUMPS = ['Fuel Pump A', 'Fuel Pump B', 'Fuel Pump C'] as const;

// Payment method options
export const PAYMENT_METHODS = [
    'Cash',
    'Bank Transfer',
    'Credit',
    'Internal Adjustment'
] as const;

// Base expense schema for add form
export const expenseAddSchema = z.object({
    expenseTitle: z.string()
        .min(1, 'Expense title is required')
        .min(3, 'Expense title must be at least 3 characters')
        .max(200, 'Expense title must be less than 200 characters'),

    expenseType: z.enum(EXPENSE_TYPES, {
        required_error: 'Expense type is required',
        invalid_type_error: 'Please select a valid expense type'
    }),

    amount: z.string()
        .min(1, 'Amount is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Amount must be a positive number'
        }),

    date: z.string()
        .min(1, 'Date is required')
        .refine((date) => {
            const selectedDate = new Date(date);
            return !isNaN(selectedDate.getTime());
        }, 'Please enter a valid date'),

    pump: z.string({
        required_error: 'Pump is required',
    }).min(1, 'Pump is required'),

    paymentMethod: z.enum(PAYMENT_METHODS, {
        required_error: 'Payment method is required',
        invalid_type_error: 'Please select a valid payment method'
    }),

    notes: z.string().optional(),
});

// Edit expense schema (same as add for now)
export const expenseEditSchema = expenseAddSchema;

// Type inference
export type ExpenseAddFormData = z.infer<typeof expenseAddSchema>;
export type ExpenseEditFormData = z.infer<typeof expenseEditSchema>;

// Validation helper functions
export const validateExpenseAdd = (data: unknown) => {
    try {
        return {
            success: true,
            data: expenseAddSchema.parse(data),
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

export const validateExpenseEdit = (data: unknown) => {
    try {
        return {
            success: true,
            data: expenseEditSchema.parse(data),
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
