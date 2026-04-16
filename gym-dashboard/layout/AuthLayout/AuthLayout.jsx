// "use client"
// import { AppSidebar } from "@/components/app-sidebar"
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
// import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
// import LoginPage from "@/app/login/page"
// import ConditionalRender from "@/layout/ConditionalRender/ConditionalRender"
// import { useEffect, useState } from "react"
// import { setAuth } from "@/lib/redux/slices/authSlice"

// const AuthLayout = ({ children }) => {
//   const dispatch = useAppDispatch()

//   const token = useAppSelector((state) => {
//     return state.auth.token
//   })
//   console.log("🚀 ~ AuthLayout ~ token:", token)

//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     console.log("useEffect triggering....")

//     const storedToken = localStorage.getItem("admin_token")
//     console.log("🚀 ~ AuthLayout ~ storedToken:", storedToken)

//     // Sync localStorage token with Redux
//     if (storedToken && !token) {
//       dispatch(setAuth(storedToken))
//     }

//     setIsLoading(false)
//   }, [dispatch])

//   // Loading screen
//   if (isLoading) {
//     return (
//       <main className="flex h-screen w-full items-center justify-center">
//         {" "}
//         LOADING...
//       </main>
//     )
//   }

//   // login rendering
//   if (!token) {
//     return <LoginPage />
//   }

//   // Authenticated rendering
//   return (
//     <SidebarProvider>
//       <AppSidebar />

//       <SidebarInset className="w-full max-w-full overflow-hidden transition-all duration-300">
//         <ConditionalRender>{children}</ConditionalRender>
//       </SidebarInset>
//     </SidebarProvider>
//   )
// }

// export default AuthLayout

"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useState } from "react"
import { setAuth } from "@/lib/redux/slices/authSlice"
import LoginPage from "@/app/login/page"
import ConditionalRender from "@/layout/ConditionalRender/ConditionalRender"

const AuthLayout = ({ children }) => {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token")
    console.log("storedToken on mount:", storedToken)

    if (storedToken && !token) {
      dispatch(setAuth(storedToken))
    }

    setIsLoading(false)
  }, [dispatch]) // ✅ Only on mount — no token dependency

  if (isLoading) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        LOADING...
      </main>
    )
  }

  if (token) {
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
