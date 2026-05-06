/** Represents a multipart file from Fastify's multipart plugin. */
export interface IncomingFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
  toBuffer(): Promise<Buffer>;
}
