import { User } from "./User.js";

export async function login(username, password) {
  const user = await User.findOne({ where: { username } });
  if (!user) return null;

  const valid = await user.validatePassword(password);
  if (!valid) return null;

  return user;
}
