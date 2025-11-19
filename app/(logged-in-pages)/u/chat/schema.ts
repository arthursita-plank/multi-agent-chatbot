import { z } from "zod"

export const chatSchema = z.object({
    input: z.string().min(1, "Please enter a message"),
})

export type ChatFormValues = z.infer<typeof chatSchema>
