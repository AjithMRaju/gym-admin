"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useState } from "react"
import { setAuth } from "@/lib/redux/slices/authSlice"
import LoginPage from "@/app/login/page"
import ConditionalRender from "@/layout/ConditionalRender/ConditionalRender"
import { GymLoader } from "@/common/loaders/GymLoader"

const AuthLayout = ({ children }) => {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const [isLoading, setIsLoading] = useState(true)
  // const BRAND_COLOR=localStorage.getItem("admin_brand_color")
  // console.log("BRAND_COLOR:", BRAND_COLOR)

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token")

    if (storedToken && !token) {
      dispatch(setAuth(storedToken))
    }

    setIsLoading(false)
  }, [dispatch]) // ✅ Only on mount — no token dependency

  if (isLoading) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <GymLoader />
      </main>
    )
  }

  if (!token) {
    return <LoginPage />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full max-w-full overflow-hidden transition-all duration-300">
        <ConditionalRender>{children}</ConditionalRender>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AuthLayout
