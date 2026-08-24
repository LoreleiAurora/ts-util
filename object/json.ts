/**
 * Represents a scalar JSON value.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a JSON-compatible value.
 */
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * Represents a JSON-compatible array.
 */
export type JsonArray = JsonValue[];

/**
 * Represents a JSON-compatible object.
 */
export type JsonObject = {
  [key: string]: JsonValue;
};
