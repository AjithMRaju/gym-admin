"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearToast } from "@/lib/redux/slices/toastSlice";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  icons,
  ShieldAlert,
} from "lucide-react";

export default function GlobalToast() {
  const dispatch = useAppDispatch();
  const { message, type } = useAppSelector((state) => state.toast);

  useEffect(() => {
    if (message && type) {
      const toastOptions = {
        duration: 4000,
        position: "top-center",
        dismissible: true,
        closeButton: true,
        icon: null,
      };

      switch (type) {
        case "success":
          toast.success(
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className=" text-green-500" />
              </div>
              <div>
                <p className="font-medium text-green-600">{type}!</p>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>,
            {
              ...toastOptions,
            }
          );

          break;
        case "error":
          toast.error(
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <ShieldAlert className=" text-red-500" />
              </div>
              <div>
                <p className="font-medium text-red-600">{type}!</p>
                <p className="text-sm text-red-600">{message}</p>
              </div>
            </div>,
            {
              ...toastOptions,
            }
          );
          break;
        case "warning":
          toast.warning(
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className=" text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-600">{type}!</p>
                <p className="text-sm text-yellow-600">{message}</p>
              </div>
            </div>,
            {
              ...toastOptions,
            }
          );
          break;
        case "info":
          toast.info(message, {
            ...toastOptions,
            icon: <Info className="h-4 w-4 text-blue-500" />,
            className: "border-blue-200 bg-blue-50 text-blue-800",
          });
          break;
        default:
          toast(message, {
            ...toastOptions,
            className: "border-gray-200 bg-gray-50 text-gray-800",
          });
      }

      dispatch(clearToast());
    }
  }, [message, type, dispatch]);

  return null;
}
