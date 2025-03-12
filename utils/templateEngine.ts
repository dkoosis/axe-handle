import * as eta from 'eta';
import path from 'path';
import fs from 'fs/promises';
import { Result, ResultAsync, err, ok } from 'neverthrow';
import { AppError, ErrorType, createError } from './errors';

export const configureTemplateEngine = (templatesDir: string): void => {
  eta.configure({
    views: path.resolve(process.cwd(), templatesDir),
    cache: process.env.NODE_ENV === 'production',
    rmWhitespace: false,
  });
};

export const renderTemplate = <T extends Record<string, unknown>>(
  templateName: string,
  data: T,
): Result<string, AppError> => {
  try {
    const rendered = eta.render(templateName, data);
    if (rendered === undefined) {
      return err(
        createError(ErrorType.INTERNAL, `Failed to render template: ${templateName}`),
      );
    }
    return ok(rendered);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(
      createError(ErrorType.INTERNAL, `Template rendering error: ${message}`, {
        templateName,
      }),
    );
  }
};

export const ensureTemplateDirectories = async (
  baseDir: string,
  directories: string[],
): Promise<ResultAsync<void, AppError>> => {
  return ResultAsync.fromPromise(
    (async () => {
      const basePath = path.resolve(process.cwd(), baseDir);
      
      try {
        await fs.mkdir(basePath, { recursive: true });
        
        for (const dir of directories) {
          const dirPath = path.join(basePath, dir);
          await fs.mkdir(dirPath, { recursive: true });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw createError(ErrorType.INTERNAL, `Failed to create template directories: ${message}`);
      }
    })(),
    (error) => createError(ErrorType.INTERNAL, String(error)),
  );
};