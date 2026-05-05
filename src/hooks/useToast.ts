import { createElement } from "react";
import toast from "react-hot-toast";
import { Download, Info } from "lucide-react";

export const notify = {
  success: (message: string) => toast.success(message, { duration: 3000 }),
  error: (message: string) => toast.error(message, { duration: 4000 }),
  loading: (message: string) => toast.loading(message),
  download: (filename: string) =>
    toast.success(`Downloading ${filename}...`, {
      icon: createElement(Download, { className: "h-4 w-4" }),
      duration: 3000,
    }),
  info: (message: string) =>
    toast(message, {
      icon: createElement(Info, { className: "h-4 w-4" }),
      duration: 3000,
    }),
  dismiss: (id?: string) => (id ? toast.dismiss(id) : toast.dismiss()),
  promise: toast.promise,
};
