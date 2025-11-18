import { redirect } from "next/navigation"
import { ROUTES } from "../constants/ROUTES"

export default function Home() {
  redirect(ROUTES.LOGIN)
}
