'use server';
import { ROUTES } from "@/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const signUpAction = async (email: string, password: string) => {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
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
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}