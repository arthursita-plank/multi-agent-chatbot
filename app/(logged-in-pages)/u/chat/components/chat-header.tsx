import { Button } from "@/components/ui/button"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

type ChatHeaderProps = {
    displayName: string
    handleSignOut: () => void
    isSigningOut: boolean
    suggestedPrompts: string[]
    handlePromptClick: (prompt: string) => void
}

export function ChatHeader({
    displayName,
    handleSignOut,
    isSigningOut,
    suggestedPrompts,
    handlePromptClick,
}: ChatHeaderProps) {
    return (
        <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-full border border-primary/30 bg-primary/10 p-3 text-primary">
                        <Sparkles className="size-5" aria-hidden />
                    </div>
                    <div>
                        <CardTitle>RobertGPT</CardTitle>
                        <CardDescription>
                            Signed in as <span className="font-medium text-foreground">{displayName}</span>
                        </CardDescription>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
                {suggestedPrompts.map((prompt) => (
                    <Button
                        key={prompt}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-dashed"
                        onClick={() => handlePromptClick(prompt)}
                    >
                        {prompt}
                    </Button>
                ))}
            </div>
        </CardHeader>
    )
}
