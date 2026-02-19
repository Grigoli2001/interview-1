import z from "zod";

export const loginSchema = z.object({
  email: z.string().min(6, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
