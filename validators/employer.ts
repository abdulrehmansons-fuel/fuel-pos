import { z } from 'zod';

// Employer status options
export const EMPLOYER_STATUS = ['Active', 'Inactive'] as const;

// Fuel pump options
export const FUEL_PUMPS = ['Fuel Pump A', 'Fuel Pump B', 'Fuel Pump C'] as const;

// Base employer schema for add form (all fields required)
export const employerAddSchema = z.object({
    fullName: z.string()
        .min(1, 'Full name is required')
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-.,()]+$/, 'Full name contains invalid characters'),

    email: z.string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .max(100, 'Email must be less than 100 characters'),

    username: z.string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),

    password: z.string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),

    mobile: z.string()
        .min(1, 'Mobile number is required')
        .regex(/^03\d{9}$/, 'Mobile number must be in format 03xxxxxxxxx'),

    address: z.string().optional(),

    status: z.enum(EMPLOYER_STATUS, {
        required_error: 'Status is required',
        invalid_type_error: 'Please select a valid status'
    }),

    fuelPump: z.string({
        required_error: 'Fuel pump is required',
    }).min(1, 'Fuel pump is required'),

    monthlySalary: z.string()
        .min(1, 'Monthly salary is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Monthly salary must be a positive number'
        }),

    advanceSalary: z.string().optional(),

    joiningDate: z.string()
        .min(1, 'Joining date is required')
        .refine((date) => {
            const selectedDate = new Date(date);
            return !isNaN(selectedDate.getTime());
        }, 'Please enter a valid date'),

    notes: z.string().optional(),
});

// Edit employer schema (username and password are optional)
export const employerEditSchema = z.object({
    fullName: z.string()
        .min(1, 'Full name is required')
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-.,()]+$/, 'Full name contains invalid characters'),

    email: z.string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .max(100, 'Email must be less than 100 characters'),

    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
        .optional()
        .or(z.literal('')),

    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters')
        .optional()
        .or(z.literal('')),

    mobile: z.string()
        .min(1, 'Mobile number is required')
        .regex(/^03\d{9}$/, 'Mobile number must be in format 03xxxxxxxxx'),

    address: z.string().optional(),

    status: z.enum(EMPLOYER_STATUS, {
        required_error: 'Status is required',
        invalid_type_error: 'Please select a valid status'
    }),

    fuelPump: z.string({
        required_error: 'Fuel pump is required',
    }).min(1, 'Fuel pump is required'),

    monthlySalary: z.string()
        .min(1, 'Monthly salary is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Monthly salary must be a positive number'
        }),

    advanceSalary: z.string().optional(),

    joiningDate: z.string()
        .min(1, 'Joining date is required')
        .refine((date) => {
            const selectedDate = new Date(date);
            return !isNaN(selectedDate.getTime());
        }, 'Please enter a valid date'),

    notes: z.string().optional(),
});

// Type inference
export type EmployerAddFormData = z.infer<typeof employerAddSchema>;
export type EmployerEditFormData = z.infer<typeof employerEditSchema>;

// Validation helper functions
export const validateEmployerAdd = (data: unknown) => {
    try {
        return {
            success: true,
            data: employerAddSchema.parse(data),
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

export const validateEmployerEdit = (data: unknown) => {
    try {
        return {
            success: true,
            data: employerEditSchema.parse(data),
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
