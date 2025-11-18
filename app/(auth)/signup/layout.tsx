import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Signup - Multi-Agent Chatbot",
    description: "A multi-agent chatbot that can handle multiple conversations at once",
};

export default function SignupLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>{children}</>
    );
}
