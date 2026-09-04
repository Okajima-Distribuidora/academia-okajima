// A convenience preference, never an authentication credential or session.
export const REMEMBERED_IDENTIFIER_KEY = "academia-okajima:remembered-identifier:v1";

type IdentifierStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type GetStorage = () => IdentifierStorage;
const browserStorage: GetStorage = () => window.localStorage;

export function readRememberedIdentifier(getStorage: GetStorage = browserStorage): string {
  try {
    const value = getStorage().getItem(REMEMBERED_IDENTIFIER_KEY);
    return value && value.length <= 255 && value.trim() ? value : "";
  } catch {
    return "";
  }
}

export function saveRememberedIdentifier(identifier: string, remember: boolean,
  getStorage: GetStorage = browserStorage): void {
  try {
    const storage = getStorage();
    if (remember && identifier.trim() && identifier.length <= 255) {
      storage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier);
    } else {
      storage.removeItem(REMEMBERED_IDENTIFIER_KEY);
    }
  } catch {
    // Storage can be blocked or full. The preference must never block login.
  }
}
