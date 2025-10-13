export type User = {
  id: string;
  email: string;
  name?: string;
  tier?: "basic" | "starter" | "pro";
};
