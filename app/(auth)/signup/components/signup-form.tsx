'use client'

import Link from "next/link"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { LuCircleCheck, LuCircle } from "react-icons/lu"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/constants"
import { signUpAction } from "@/actions"

const passwordPattern = /^(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/

const signupSchema = z
    .object({
        email: z.email("Enter a valid email"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                passwordPattern,
                "Password must include at least one number and one special character"
            ),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords must match",
        path: ["confirmPassword"],
    })

type SignupFormValues = z.infer<typeof signupSchema>

export const SignupForm = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const passwordValue = watch("password") ?? ""

    const passwordChecklist = [
        {
            label: "At least 8 characters",
            met: passwordValue.length >= 8,
        },
        {
            label: "Contains a number",
            met: /\d/.test(passwordValue),
        },
        {
            label: "Contains a special character",
            met: /[^\da-zA-Z]/.test(passwordValue),
        },
    ]

    const onSubmit = async (values: SignupFormValues) => {
        toast.promise(
            signUpAction(values.email, values.password),
            {
                loading: "Creating account...",
                success: "An email has been sent to you to verify your account",
                error: "Failed to create account. Please try again.",
            }
        )
    }

    return (
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                    Email
                </label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby="email-error"
                    {...register("email")}
                />
                {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                <div className="space-y-2">
                    <label
                        className="text-sm font-medium text-foreground"
                        htmlFor="password"
                    >
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        aria-describedby="password-error"
                        {...register("password")}
                    />
                    {errors.password && (
                        <p id="password-error" className="text-sm text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div
                    className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-sm"
                    aria-live="polite"
                >
                    <p className="mb-2 font-medium text-foreground">Password must include:</p>
                    <ul className="space-y-1.5">
                        {passwordChecklist.map((item) => (
                            <li
                                key={item.label}
                                className="flex items-center gap-2"
                                aria-live="polite"
                            >
                                {item.met ? (
                                    <LuCircleCheck className="text-green-500" aria-hidden="true" />
                                ) : (
                                    <LuCircle className="text-muted-foreground" aria-hidden="true" />
                                )}
                                <span className={item.met ? "text-foreground" : "text-muted-foreground"}>
                                    {item.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="space-y-2">
                <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="confirmPassword"
                >
                    Confirm password
                </label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby="confirmPassword-error"
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                    <p
                        id="confirmPassword-error"
                        className="text-sm text-destructive"
                    >
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-sm">
                Already have an account?{" "}
                <Link href={ROUTES.LOGIN} className="text-primary underline">
                    Sign in
                </Link>
            </p>
        </form>
    )
}

