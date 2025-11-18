import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chat - RobertGPT",
    description: "A multi-agent chatbot that can handle multiple conversations at once",
};

export default function UserLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>{children}</>
    );
}
