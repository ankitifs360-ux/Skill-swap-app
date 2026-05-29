export const getImageUrl = (imagePath = "") => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const base = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

  return `${base}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
};
