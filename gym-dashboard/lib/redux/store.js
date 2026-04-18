import { configureStore } from "@reduxjs/toolkit"
import alertReducer from "./slices/alertSlice"
import toastReducer from "./slices/toastSlice"
import authReducer from "./slices/authSlice"
import brandReducer from "./slices/brandSlice"

export const store = configureStore({
  reducer: {
    alert: alertReducer,
    toast: toastReducer,
    auth: authReducer,
    brand: brandReducer,
  },
})
