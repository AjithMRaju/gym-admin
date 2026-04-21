/**
 * cloudinaryUpload.js
 * Shared utility for direct-to-Cloudinary uploads from the frontend.
 * Bypasses the backend (and Vercel's 4.5MB limit) entirely.
 *
 * Usage:
 *   import { uploadToCloudinary } from "@/lib/cloudinaryUpload"
 *   const url = await uploadToCloudinary(file, "hero", axiosInstance)
 */

/**
 * Step 1: Ask your backend for a signed upload signature.
 * Step 2: POST the file directly to Cloudinary.
 * Returns the secure_url string.
 *
 * @param {File}   file          - The File object to upload
 * @param {string} folder        - Backend folder name: 'hero' | 'about' | 'services' | 'gallery'
 * @param {object} axiosInstance - Your configured axios instance (handles auth headers)
 * @param {function} onProgress  - Optional (percent: number) => void callback
 * @returns {Promise<string>}    - Resolves to the Cloudinary secure_url
 */
export async function uploadToCloudinary(
  file,
  folder,
  axiosInstance,
  onProgress
) {
  // 1. Get signed params from backend
  const { data } = await axiosInstance.get(`/${folder}/sign-upload`)
  const {
    signature,
    timestamp,
    cloud_name,
    api_key,
    folder: cloudFolder,
  } = data

  // 2. Determine resource type
  const isVideo = file.type.startsWith("video/")

  // 3. Build FormData for Cloudinary
  const fd = new FormData()
  fd.append("file", file)
  fd.append("signature", signature)
  fd.append("timestamp", String(timestamp))
  fd.append("api_key", api_key)
  fd.append("folder", cloudFolder)

  // 4. Upload directly to Cloudinary
  const resourceType = isVideo ? "video" : "image"
  const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`

  const response = await fetch(cloudUrl, {
    method: "POST",
    body: fd,
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || "Cloudinary upload failed")
  }

  const result = await response.json()
  return result.secure_url
}
