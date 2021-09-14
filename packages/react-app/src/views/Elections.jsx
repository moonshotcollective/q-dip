import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useEventListener } from "../hooks";
import { Address } from "../components";
import { mainnetProvider, blockExplorer } from "../App";
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
import { PlusOutlined, } from "@ant-design/icons";

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
      align: "center",
      render: name => <Typography.Title level={5}>{name}</Typography.Title>,
    },
    {
      title: "Creator", 
      dataIndex: "creator", 
      key: "creator",
      align: "center", 
      render: creator => <Address address={creator} fontSize="14pt" ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
    },
    {
      title: "№ Voted",
      dataIndex: "n_voted",
      key: "n_voted",
      align: "center",
    },
    {
      title: "Tags", 
      dataIndex: "tags", 
      key: "tags", 
      align: "center", 
      render: tags =>
        tags.map(r => {
          let color = "geekblue";
          if (r == "candidate") {
            color = "green";
          } 
          if ( r === "voted" ) {
            color = "purple";
          }
          return (
            <Tag color={color} key={r}>
              {r.toLowerCase()}
            </Tag>
          );
        }),
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
            <Button type="default" size="small" shape="round" onClick={() => voteElection(index)}>
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

  function createElection() {
    route_history.push("/create");
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
      console.log({ election })
      
      const electionVoted = await readContracts.Diplomacy.getElectionVoted(i);  
      const hasVoted = await readContracts.Diplomacy.hasVoted(i, address);

      const tags = []
      if ( election.admin === address ) {
        tags.push("admin");
      }      
      if ( election.candidates.includes(address) ) {
        tags.push("candidate");
      }
      if ( hasVoted ) {
        tags.push("voted")
      }

      let electionEntry = {
        name: election.name,
        creator: election.admin,
        n_voted: electionVoted.toNumber(),
        tags: tags,
      };

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

  const onBallotCast = async (msg, electionsMap) => {
    console.log("onBallotCast ", msg);
    let election = electionsMap.get(msg.electionId.toNumber());
    const electionVoted = await readContracts.Diplomacy.getElectionVoted(msg.electionId.toNumber())
    election.n_voted = electionVoted;//election.n_voted + 1;
    electionsMap.set(msg.electionId.toNumber(), election);
  }

  const onElectionCreated = async (msg, electionsMap) => {
    console.log("onElectionCreated ", msg);
    const election = await readContracts.Diplomacy.getElectionById(msg.electionId.toNumber());
    const electionVoted = await readContracts.Diplomacy.getElectionVoted(msg.electionId.toNumber());
    let initElectionEntry = {
      name: election.name, 
      n_voted: electionVoted.toNumber()
    };
    electionsMap.set(msg, initElectionEntry);
  }

  function voteElection(index) {
    let adrs = ["0x7F2FA234AEd9F7FA0D5070Fb325D1c2C983E96b1", "0x154e80Ebc2e4769A1B680CAC800eE3A2613dC8D6"];
    let votes = [2, 3];
    const result = tx(writeContracts.Diplomacy.castBallot(index, adrs, votes), update => {
      console.log("📡 Transaction Update:", update);
    });
  }

  return (
    <>
      <div
        className="elections-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}
      >
        <PageHeader
          ghost={false}
          title="Elections"
          extra={[
            <Button icon={<PlusOutlined />}type="primary" size="large" shape="round" style={{ margin: 4 }} onClick={createElection}>
              Create Election
            </Button>,
          ]}
        />
        <Divider />
        {electionsMap && <Table dataSource={Array.from(electionsMap.values())} columns={columns} pagination={false}></Table>}
      </div>
    </>
  );
}
