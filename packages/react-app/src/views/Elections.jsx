import {
  Button,
  Divider,
  Input,
  InputNumber,
  List,
  Table,
  Modal,
  Form,
  Select,
  Space,
  Tag,
  Descriptions,
  PageHeader,
  Carousel,
  Typography,
} from "antd";
import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useEventListener } from "../hooks";

var Map = require("collections/map");

export default function Elections({
  address,
  mainnetProvider,
  localProvider,
  mainnetContracts,
  userSigner,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {

  const [electionsMap, setElectionsMap] = useState();

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      align: "center",
      render: name => <Typography.Title level={5}>{name}</Typography.Title>,
    },
    {
      title: "Voted",
      dataIndex: "n_voted",
      key: "n_voted",
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button type="default" size="small" shape="round" onClick={() => viewElection(record)}>
              View
            </Button>
            <Button type="default" size="small" shape="round" onClick={() => voteElection(record)}>
              Vote
            </Button>
          </Space>
        </>
      ),
    },
  ];

  const route_history = useHistory();

  function viewElection(record) {
    route_history.push("/voting/" + record.key);
  }

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
      }
    }
  }, [readContracts]);

  const init = async () => {
    
    const electionsMap = new Map();
    
    const numElections = await readContracts.Diplomacy.numElections();
    for (let i = 0; i < numElections; i++) {
      const election = await readContracts.Diplomacy.getElectionById(i);
      const electionVoted = await readContracts.Diplomacy.getElectionVoted(i);
      console.log({ electionVoted })
      let electionEntry = {};
      electionEntry.name = election.name;
      electionEntry.n_voted = electionVoted.toNumber();
      electionsMap.set(i, electionEntry);
    }

    setElectionsMap(electionsMap);

    addEventListener("Diplomacy", "BallotCast", onBallotCast, electionsMap);
    addEventListener("Diplomacy", "ElectionCreated", onElectionCreated, electionsMap);

  }


  const addEventListener = async (contractName, eventName, callback, electionsMap) => {
    await readContracts[contractName].removeListener(eventName);

    readContracts[contractName].on(eventName, (...args) => {
      let msg = args.pop().args;
      callback(msg, electionsMap);
    });
  };

  function onBallotCast(msg, electionsMap) {
    console.log("onBallotCast ", msg);
    let election = electionsMap.get(msg.electionId.toNumber());
    election.n_voted = election.n_voted + 1;
    electionsMap.set(msg.electionId.toNumber(), election);
  }

  async function onElectionCreated(msg, electionsMap) {
    console.log("onElectionCreated ", msg);
    const election = await readContracts.Diplomacy.getElectionById(msg.electionId.toNumber());
    const electionVoted = await readContracts.Diplomacy.getElectionVoted(msg.electionId.toNumber());
    let electionEntry = {};
    electionEntry.name = election.name;
    electionEntry.n_voted = electionVoted.toNumber();
    electionsMap.set(msg, electionEntry);
  }

  function voteElection(record) {
    let adrs = ["0x7F2FA234AEd9F7FA0D5070Fb325D1c2C983E96b1", "0x154e80Ebc2e4769A1B680CAC800eE3A2613dC8D6"];
    let votes = [2, 3];
    const result = tx(writeContracts.Diplomacy.castBallot(0, adrs, votes), update => {
      console.log("📡 Transaction Update:", update);
    });
  }

  return (
    <>
      <div
        className="elections-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}
      >
        {electionsMap && <Table dataSource={Array.from(electionsMap.values())} columns={columns}></Table>}
      </div>
    </>
  );
}
