import { User } from "../../types";

export type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";

export interface AuthStateChangePayload {
	/** Optional user associated with the event. */
	user?: User | null;
}

export interface AuthSubscription {
	unsubscribe: () => void;
}

export interface AuthProvider {
	getSession: () => Promise<User | null>;
	onAuthStateChange: (
		callback: (event: AuthEvent, payload: AuthStateChangePayload) => void
	) => AuthSubscription;
	signUp: (
		email: string,
		password: string,
		displayName?: string
	) => Promise<{ user: User }>;
	signIn: (email: string, password: string) => Promise<{ user: User }>;
	signOut: () => Promise<void>;
}


