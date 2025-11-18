'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ROUTES } from "@/constants"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { toast } from "sonner"
import { loginAction } from "@/actions"

const loginSchema = z.object({
    email: z.email("Enter a valid email"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(64, "Password must be 64 characters or less"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const LoginForm = () => {

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = async (values: LoginFormValues) => {
        toast.promise(
            loginAction(values.email, values.password), {
            loading: "Signing in...",
            success: "Signed in successfully. Redirecting to chat...",
            error: "Failed to sign in. Please try again.",
        }
        )
    }

    return (
        <form
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
        >
            <div className="space-y-2">
                <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="email"
                >
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
                    autoComplete="current-password"
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-sm text-center">
                Don't have an account? <Link href={ROUTES.SIGNUP} className="text-primary underline">Sign up</Link>
            </p>
        </form>
    )
}