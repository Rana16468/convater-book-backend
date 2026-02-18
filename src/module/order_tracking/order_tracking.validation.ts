import {z} from 'zod';

const orderTrackingSchema=z.object({
    body: z.object({
        phone: z.string({required_error:"phone number is  required"}),
        password: z.string({required_error:"password is required"})
    })
});


const orderTrackingValidation={
    orderTrackingSchema
};

export default orderTrackingValidation;