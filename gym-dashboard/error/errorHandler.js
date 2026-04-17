export const handleApiError = (error) => {
  let message = "An unexpected error occurred.";

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        // Handle validation errors (e.g., "Email is mandatory")
        message = data.message || "Invalid request. Please check your input.";
        if (data.errors) {
          // If backend returns an object of field errors
          message = Object.values(data.errors).flat().join(", ");
        }
        break;
      case 401:
        message = "Unauthorized. Please login again.";
        // Optional: window.location.href = '/login';
        break;
      case 403:
        message = "You do not have permission to perform this action.";
        break;
      case 404:
        message = "The requested resource was not found.";
        break;
      case 500:
        message = "Server error. Please try again later.";
        break;
      default:
        message = data.message || message;
    }
  } else if (error.request) {
    message = "No response from server. Check your internet connection.";
  }

  return message;
};
