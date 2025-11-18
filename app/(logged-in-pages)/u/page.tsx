import { ROUTES } from "@/constants";
import { redirect } from "next/navigation";

export default function UserPage() {
    redirect(ROUTES.CHAT)
}