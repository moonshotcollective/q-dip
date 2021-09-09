import { action } from 'easy-peasy';

export const vote = {
  votes: [],
  addVote: action((state, payload) => {
    state.votes.push(payload);
  }),
};