import axiosInstance from "@/lib/config/axiosConfig"

export async function uploadFileToCloudinary(file, folder) {
  // 1. Get signature from backend
  const sigRes = await axiosInstance.get(`/${folder}/sign-upload`)

  if (!sigRes.data) throw new Error("Failed to get upload signature")
  const {
    signature,
    timestamp,
    cloud_name,
    api_key,
    folder: cloudFolder,
  } = await sigRes.data

  // 2. Determine resource type
  const isVideo = file.type.startsWith("video/")
  const resourceType = isVideo ? "video" : "image"

  // 3. POST directly to Cloudinary
  const fd = new FormData()
  fd.append("file", file)
  fd.append("signature", signature)
  fd.append("timestamp", String(timestamp))
  fd.append("api_key", api_key)
  fd.append("folder", cloudFolder)

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`,
    { method: "POST", body: fd }
  )

  if (!cloudRes.ok) {
    const err = await cloudRes.json()
    throw new Error(err?.error?.message || "Cloudinary upload failed")
  }
  const result = await cloudRes.json()
  return result.secure_url
}
