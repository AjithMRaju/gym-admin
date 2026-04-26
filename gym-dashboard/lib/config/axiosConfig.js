import axios from "axios"

const tempToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGRlM2FkMzZmOTJjZjA2MmI4ODcxNiIsImlhdCI6MTc3NjMyNzQ2NiwiZXhwIjoxNzc2OTMyMjY2fQ.8EyrVqQs9SE1SnTW189xBn134Uzirq9l0EswHiEhyIw"
// Create the instance
const axiosInstance = axios.create({
  baseURL: "https://gym-backedn.vercel.app/api/",
  // baseURL: "http://localhost:8000/api/", // For local development
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// --- Request Interceptor ---
// Perfect for adding Authorization headers dynamically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// --- Response Interceptor ---
// Perfect for global error handling (like 401 unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Logic for logout or refreshing tokens could go here
      console.error("Unauthorized! Redirecting to login...")
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
