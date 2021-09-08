export { default as Transactor } from "./Transactor";
import Ceramic from '@ceramicnetwork/http-client';
import { IDX } from '@ceramicstudio/idx';
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect';
import { createDefinition, publishSchema } from '@ceramicstudio/idx-tools';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';
import { DID } from 'dids';
import { schemas } from '../schemas';
import ceramicConfig from '../config.json';

export const makeCeramicClient = async (address) => {
  const ceramic = new Ceramic('http://localhost:7007')
  const threeIdConnect = new ThreeIdConnect();
  const authProvider = new EthereumAuthProvider(window.ethereum, address);
  await threeIdConnect.connect(authProvider)
  const did = new DID({
    provider: threeIdConnect.getDidProvider(),
    resolver: ThreeIdResolver.getResolver(ceramic),
  });
  await did.authenticate()
  await ceramic.setDID(did);
  const idx = new IDX({ ceramic, aliases: ceramicConfig.definitions });
  return { ceramic, idx, schemasCommitId: ceramicConfig.schemas };
}