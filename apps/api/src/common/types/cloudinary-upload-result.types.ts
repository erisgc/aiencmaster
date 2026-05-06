/** Typed result from a Cloudinary upload operation. */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  original_filename: string;
  bytes: number;
}
