import { action } from "easy-peasy";

export const user = {
  basicProfile: {},
  setBasicProfile: action((state, payload) => {
    state.basicProfile = payload;
  }),
  cryptoAccounts: {},
  setCryptoAccounts: action((state, payload) => {
    state.cryptoAccounts = payload;
  }),
};
