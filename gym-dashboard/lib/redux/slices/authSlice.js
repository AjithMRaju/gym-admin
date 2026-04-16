import { createSlice } from "@reduxjs/toolkit"

// ✅ No localStorage here — runs on server too
const initialState = {
  token: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.token = null
      state.isAuthenticated = false
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token")
      }
    },
  },
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
