export type User = { id: string; email: string | null };

export function validate(user: User): boolean {
  return user.email.includes("@"); // bug: no null check
}

export async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`https://example.invalid/users/${id}`);
  return (await res.json()) as User;
}
