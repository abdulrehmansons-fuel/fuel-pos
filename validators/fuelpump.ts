import { z } from 'zod';

// Status options
export const PUMP_STATUS = ['active', 'inactive'] as const;

// Fuel type options (for checkboxes)
export const FUEL_TYPE_OPTIONS = [
    'Petrol',
    'Diesel',
    'High-Octane',
    'Engine Oil',
    'Lubricants'
] as const;

// Base fuel pump schema for add form
export const fuelPumpAddSchema = z.object({
    pumpName: z.string()
        .min(1, 'Pump name is required')
        .min(2, 'Pump name must be at least 2 characters')
        .max(100, 'Pump name must be less than 100 characters'),

    location: z.string()
        .max(200, 'Location must be less than 200 characters')
        .optional(),

    status: z.enum(PUMP_STATUS, {
        required_error: 'Status is required',
        invalid_type_error: 'Please select a valid status'
    }),

    totalNozzles: z.string()
        .min(1, 'Total nozzles is required')
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number.isInteger(Number(val)), {
            message: 'Total nozzles must be a positive whole number'
        }),

    selectedFuelTypes: z.array(z.string()).optional(),

    selectedEmployees: z.array(z.string()).optional(),

    notes: z.string().optional(),
});

// Edit fuel pump schema (same as add for now)
export const fuelPumpEditSchema = fuelPumpAddSchema;

// Type inference
export type FuelPumpAddFormData = z.infer<typeof fuelPumpAddSchema>;
export type FuelPumpEditFormData = z.infer<typeof fuelPumpEditSchema>;

// Validation helper functions
export const validateFuelPumpAdd = (data: unknown) => {
    try {
        return {
            success: true,
            data: fuelPumpAddSchema.parse(data),
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

export const validateFuelPumpEdit = (data: unknown) => {
    try {
        return {
            success: true,
            data: fuelPumpEditSchema.parse(data),
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
