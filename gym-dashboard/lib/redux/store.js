import { configureStore } from "@reduxjs/toolkit"
// import alertReducer from "./slices/alertSlice"
// import toastReducer from "./slices/toastSlice"
import authReducer from "./slices/authSlice"

export const store = configureStore({
  reducer: {
    // alert: alertReducer,
    // toast: toastReducer,
    auth: authReducer,
  },
})
