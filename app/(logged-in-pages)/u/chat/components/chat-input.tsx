import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal } from "lucide-react"
import { KeyboardEvent } from "react"
import { UseFormReturn } from "react-hook-form"
import { ChatFormValues } from "../schema"

type ChatInputProps = {
    form: UseFormReturn<ChatFormValues>
    onSubmit: (values: ChatFormValues) => Promise<void>
    isLoading: boolean
}

export function ChatInput({
    form,
    onSubmit,
    isLoading,
}: ChatInputProps) {
    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            form.handleSubmit(onSubmit)()
        }
    }

    const canSend = form.watch("input").trim().length > 0 && !isLoading

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-3">
                <FormField
                    control={form.control}
                    name="input"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me to break down a goal, summarize ideas, or plan next steps…"
                                    aria-label="Message"
                                    className="min-h-[140px] resize-none"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex items-center justify-between">
                    <Button
                        type="submit"
                        disabled={!canSend}
                        className="gap-2"
                    >
                        Send
                        <SendHorizontal className="size-4" aria-hidden />
                    </Button>
                </div>
            </form>
        </Form>
    )
}
