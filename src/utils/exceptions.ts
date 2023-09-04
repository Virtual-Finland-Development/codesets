import { ValiError } from "valibot";

export class ValidationError extends ValiError {
    constructor(message: string) {
        super([
            {
                reason: "unknown",
                validation: "",
                origin: "value",
                message: message,
                input: {},
            }
        ]);
        this.name = "ValidationError";
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}