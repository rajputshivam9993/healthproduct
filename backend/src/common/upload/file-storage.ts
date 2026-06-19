import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

/** Local filesystem directory for uploaded files (served at /uploads). */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (Req 2.1)

const IMAGE_MIME = ['image/jpeg', 'image/png'];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB (Req 4.3)

type MulterFile = { originalname: string; mimetype: string };
type FileCallback = (error: Error | null, acceptFile: boolean) => void;

/**
 * Multer options for medical-document uploads (Req 2.1, 2.2). In dev files are
 * stored on local disk; production swaps in an S3 presigned-URL strategy. Accepts
 * PDF/JPEG/PNG up to 10 MB.
 */
export const medicalDocumentStorage = {
  storage: diskStorage({
    destination: (_req: Request, _file: MulterFile, cb: (e: Error | null, dest: string) => void) => {
      if (!existsSync(UPLOADS_DIR)) {
        mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      cb(null, UPLOADS_DIR);
    },
    filename: (_req: Request, file: MulterFile, cb: (e: Error | null, name: string) => void) => {
      cb(null, `${uuidv4()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req: Request, file: MulterFile, cb: FileCallback) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new BadRequestException('Document must be a PDF, JPEG, or PNG'), false);
      return;
    }
    cb(null, true);
  },
};

/** Multer options for avatar image uploads (Req 4.3, 4.4): JPEG/PNG up to 5 MB. */
export const avatarStorage = {
  storage: diskStorage({
    destination: (_req: Request, _file: MulterFile, cb: (e: Error | null, dest: string) => void) => {
      if (!existsSync(UPLOADS_DIR)) {
        mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      cb(null, UPLOADS_DIR);
    },
    filename: (_req: Request, file: MulterFile, cb: (e: Error | null, name: string) => void) => {
      cb(null, `avatar-${uuidv4()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: (_req: Request, file: MulterFile, cb: FileCallback) => {
    if (!IMAGE_MIME.includes(file.mimetype)) {
      cb(new BadRequestException('Avatar must be a JPEG or PNG image'), false);
      return;
    }
    cb(null, true);
  },
};
