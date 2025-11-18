import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - Multi-Agent Chatbot",
    description: "A multi-agent chatbot that can handle multiple conversations at once",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>{children}</>
    );
}
