import { createStore } from "easy-peasy";
import { user } from "./entities/user";
import { vote } from "./entities/vote";

export const store = createStore({
  user,
  vote,
});
