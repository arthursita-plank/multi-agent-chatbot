'use server'

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ChatMessage } from "@/app/(logged-in-pages)/u/chat/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createChat(title: string = "New Chat") {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const { data, error } = await supabase
        .from("chats")
        .insert({
            user_id: user.id,
            title,
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating chat:", error)
        throw new Error("Failed to create chat")
    }

    revalidatePath("/u/chat")
    return data
}

export async function getChats() {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from("chats")
        .select("*")
        .order("updated_at", { ascending: false })

    if (error) {
        console.error("Error fetching chats:", error)
        return []
    }

    return data
}

export async function getMessages(chatId: string): Promise<ChatMessage[]> {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching messages:", error)
        return []
    }

    return data.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date(msg.created_at),
        agent: msg.agent as any,
    }))
}

export async function saveMessage(chatId: string, message: ChatMessage) {
    const supabase = await createSupabaseServerClient()

    // First ensure the chat exists and belongs to user (RLS will handle the user check, but good to be explicit if needed)
    // For now we trust RLS.

    const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        role: message.role,
        content: message.content,
        agent: message.agent,
        // We let Supabase handle created_at or pass it if we want to preserve client timestamp?
        // Usually better to let server handle it, but for optimistic UI we might want to match.
        // Let's use server time for consistency in DB, but we can pass it if needed.
    })

    if (error) {
        console.error("Error saving message:", error)
        throw new Error("Failed to save message")
    }

    // Update chat updated_at
    await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId)

    revalidatePath(`/u/chat/${chatId}`)
    revalidatePath("/u/chat")
}

export async function deleteChat(chatId: string) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("chats").delete().eq("id", chatId)

    if (error) {
        console.error("Error deleting chat:", error)
        throw new Error("Failed to delete chat")
    }

    revalidatePath("/u/chat")
}
