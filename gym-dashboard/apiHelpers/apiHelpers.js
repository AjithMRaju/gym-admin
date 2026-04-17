import axiosInstance from "../../lib/config/axiosConfig";
import { showAlerts } from "../../common/alerts/GlobalAlerts";
import { showToast } from "../../common/alerts/GlobalToast";
/**
 * @param {string} url - API Endpoint
 * @param {object} options - { data, dispatch, successMsg, showSuccess = true }
 */
export const apiRequest = async (
  method,
  url,
  {
    data = null,
    dispatch = null,
    successMsg = "Success!",
    showSuccess = false,
  } = {},
) => {
  try {
    const response = await axiosInstance({ method, url, data });

    if (showSuccess && dispatch) {
      dispatch(
        showToast({
          message: successMsg,
          type: "success",
        }),
      );
    }

    return response.data;
  } catch (error) {
    if (dispatch) {
      dispatch(
        showAlerts({
          message: error,
          type: "error",
        }),
      );
    }
    throw error; // Re-throw so the component can handle local loading states
  }
};

export const getData = (url, options) => apiRequest("GET", url, options);
export const postData = (url, data, options) =>
  apiRequest("POST", url, { ...options, data });
export const putData = (url, data, options) =>
  apiRequest("PUT", url, { ...options, data });
export const deleteData = (url, options) => apiRequest("DELETE", url, options);
