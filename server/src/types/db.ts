export interface DbError {
  code?: string;
  message?: string;
  detail?: string;
  cause?: {
    code?: string;
    message?: string;
    detail?: string;
  };
}
