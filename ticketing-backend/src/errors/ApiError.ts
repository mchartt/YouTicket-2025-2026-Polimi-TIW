//QUI DEFINISCO GLI ERRORI API
export class ApiError extends Error {
  constructor(public status: number, public body: any) { super(typeof body === "string" ? body : body.error || "Error"); }
}
