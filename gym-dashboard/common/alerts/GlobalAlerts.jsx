"use client";
import { useSelector, useDispatch } from "react-redux";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { hideAlert } from "@/lib/redux/slices/alertSlice";
import { FaCircleExclamation, FaCircleInfo } from "react-icons/fa6";
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon } from "lucide-react";
import { IoCloseOutline } from "react-icons/io5";
import { useEffect } from "react";

export default function GlobalAlert() {
  const dispatch = useDispatch();
  const { message, type, visible } = useSelector((state) => state.alert);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dispatch(hideAlert());
      }, 4000); // 3 seconds for better readability
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible) return null;

  // Normalize type to lowercase
  const normalizedType = type?.toLowerCase();

  const config = {
    success: {
      icon: <CheckCircleIcon className="h-5 w-5 mt-1 text-green-500" />,
      style: "bg-green-50 text-green-700 border border-green-200",
      title: "Success",
      variant: "default",
    },
    error: {
      icon: <FaCircleExclamation className="h-5 w-5 mt-1 text-red-500" />,
      style: "bg-red-50 text-red-700 border border-red-200",
      title: "Error",
      variant: "destructive",
    },
    warning: {
      icon: <AlertTriangleIcon className="h-5 w-5 mt-1 text-yellow-500" />,
      style: "bg-yellow-50 text-yellow-800 border border-yellow-300",
      title: "Warning",
      variant: "default",
    },
    info: {
      icon: <InfoIcon className="h-5 w-5 mt-1 text-blue-500" />,
      style: "bg-blue-50 text-blue-700 border border-blue-200",
      title: "Info",
      variant: "default",
    },
  };

  const { icon, style, title, variant } = config[normalizedType] || config.info;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-[90%] max-w-md">
      <Alert
        variant={variant}
        className={`flex items-start gap-2 rounded-md px-4 py-3 ${style}`}
      >
        {icon}

        <div className="flex-1">
          <AlertTitle className="font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-sm">{message}</AlertDescription>
        </div>

        <button
          onClick={() => dispatch(hideAlert())}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          <IoCloseOutline size={20} />
        </button>
      </Alert>
    </div>
  );
}
