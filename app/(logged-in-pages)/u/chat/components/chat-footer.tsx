import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal } from "lucide-react"
import { useState } from "react"

export const ChatFooter = () => {

    const [input, setInput] = useState("")
    const canSend = input.trim().length > 0


    return (
        <CardFooter className="flex flex-col gap-3">
            <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask me to break down a goal, summarize ideas, or plan next steps…"
                aria-label="Message"
                className="min-h-[140px] resize-none"
            />
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    disabled={!canSend}
                    className="gap-2"
                >
                    Send
                    <SendHorizontal className="size-4" aria-hidden />
                </Button>
            </div>
        </CardFooter>
    )
}