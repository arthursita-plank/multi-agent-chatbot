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
import { KeyboardEvent, useRef } from "react"
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            form.handleSubmit(onSubmit)()
        }
    }

    const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
        const target = event.currentTarget
        target.style.height = "auto"
        const newHeight = Math.min(target.scrollHeight, 200) // Max height 200px
        target.style.height = `${newHeight}px`
    }

    const canSend = form.watch("input").trim().length > 0 && !isLoading

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex w-full items-center">
                <FormField
                    control={form.control}
                    name="input"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormControl>
                                <Textarea
                                    {...field}
                                    ref={(e) => {
                                        field.ref(e)
                                        // @ts-ignore
                                        textareaRef.current = e
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onInput={handleInput}
                                    placeholder="How can I help?"
                                    aria-label="Message"
                                    className="min-h-[50px] max-h-[200px] w-full resize-none rounded-2xl border-muted bg-muted/50 py-3 pl-5 pr-14 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-y-auto"
                                    rows={1}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    disabled={!canSend}
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                >
                    <SendHorizontal className="size-4" aria-hidden />
                    <span className="sr-only">Send</span>
                </Button>
            </form>
        </Form>
    )
}
