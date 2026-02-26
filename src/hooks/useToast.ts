import toast from "react-hot-toast";

export const notify = {
  success: (message: string) =>
    toast.success(message, {
      duration: 3000,
      style: {
        background: "#1a1a2e",
        color: "#fff",
        border: "1px solid #16213e",
      },
    }),

  error: (message: string) =>
    toast.error(message, {
      duration: 4000,
      style: {
        background: "#1a1a2e",
        color: "#fff",
        border: "1px solid #c62a2a",
      },
    }),

  loading: (message: string) =>
    toast.loading(message, {
      style: {
        background: "#1a1a2e",
        color: "#fff",
        border: "1px solid #16213e",
      },
    }),

  download: (filename: string) =>
    toast.success(`Downloading ${filename}...`, {
      icon: "⬇️",
      duration: 3000,
      style: {
        background: "#1a1a2e",
        color: "#fff",
        border: "1px solid #16213e",
      },
    }),

  info: (message: string) =>
    toast(message, {
      icon: "ℹ️",
      duration: 3000,
      style: {
        background: "#1a1a2e",
        color: "#fff",
        border: "1px solid #16213e",
      },
    }),

  dismiss: (id?: string) => (id ? toast.dismiss(id) : toast.dismiss()),
  promise: toast.promise,
};
