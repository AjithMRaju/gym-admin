// redux/alertSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  message: "",
  type: "error", // 'success' | 'error' | 'info'
  visible: false,
};

const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    showAlert: (state, action) => {
      state.message = action.payload.message;
      state.type = action.payload.type || "error";
      state.visible = true;
    },
    hideAlert: (state) => {
      state.visible = false;
    },
  },
});

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
