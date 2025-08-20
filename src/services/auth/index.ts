import { localAuthProvider } from "./localAuthProvider";
import type { AuthProvider } from "./provider";

// Swap implementation here if you add another provider (e.g., Firebase, custom API)
export const auth: AuthProvider = localAuthProvider;


