import { AuthEvent, AuthProvider, AuthStateChangePayload, AuthSubscription } from "./provider";
import { User } from "../../types";

const USERS_STORAGE_KEY = "sf_users";
const SESSION_STORAGE_KEY = "sf_session_user_id";

function loadUsers(): Record<string, { user: User; passwordHash: string }> {
	try {
		const raw = localStorage.getItem(USERS_STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function saveUsers(users: Record<string, { user: User; passwordHash: string }>) {
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function simpleHash(input: string): string {
	// Non-cryptographic hash for demo purposes only.
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	return String(hash);
}

export class LocalAuthProvider implements AuthProvider {
	private listeners = new Set<(event: AuthEvent, payload: AuthStateChangePayload) => void>();

	async getSession(): Promise<User | null> {
		const userId = localStorage.getItem(SESSION_STORAGE_KEY);
		if (!userId) return null;
		const users = loadUsers();
		return users[userId]?.user ?? null;
	}

	onAuthStateChange(
		callback: (event: AuthEvent, payload: AuthStateChangePayload) => void
	): AuthSubscription {
		this.listeners.add(callback);
		return {
			unsubscribe: () => this.listeners.delete(callback),
		};
	}

	private emit(event: AuthEvent, payload: AuthStateChangePayload) {
		for (const cb of this.listeners) cb(event, payload);
	}

	async signUp(email: string, password: string, displayName?: string): Promise<{ user: User }> {
		const normalizedEmail = email.toLowerCase().trim();
		const users = loadUsers();
		const existing = Object.values(users).find(u => u.user.email === normalizedEmail);
		if (existing) throw new Error("Email already registered");

		const now = new Date();
		const id = `local_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`;
		const user: User = {
			id,
			email: normalizedEmail,
			displayName,
			createdAt: now,
			updatedAt: now,
			role: "user",
			isOnline: navigator.onLine,
		};
		users[id] = { user, passwordHash: simpleHash(password) };
		saveUsers(users);
		localStorage.setItem(SESSION_STORAGE_KEY, id);
		this.emit("SIGNED_IN", { user });
		return { user };
	}

	async signIn(email: string, password: string): Promise<{ user: User }> {
		const normalizedEmail = email.toLowerCase().trim();
		const users = loadUsers();
		const record = Object.values(users).find(u => u.user.email === normalizedEmail);
		if (!record) throw new Error("Invalid credentials");
		if (record.passwordHash !== simpleHash(password)) throw new Error("Invalid credentials");
		localStorage.setItem(SESSION_STORAGE_KEY, record.user.id);
		this.emit("SIGNED_IN", { user: record.user });
		return { user: record.user };
	}

	async signOut(): Promise<void> {
		const user = await this.getSession();
		localStorage.removeItem(SESSION_STORAGE_KEY);
		this.emit("SIGNED_OUT", { user });
	}
}

export const localAuthProvider = new LocalAuthProvider();


