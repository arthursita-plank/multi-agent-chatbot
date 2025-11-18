'use server';
import { ROUTES } from "@/constants";
import db from "@/services/db"

export const signUpAction = async (email: string, password: string) => {
    const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.CHAT}`,
        },
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export const loginAction = async (email: string, password: string) => {
    const { data, error } = await db.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}