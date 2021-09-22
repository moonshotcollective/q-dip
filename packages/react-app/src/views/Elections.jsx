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
import { PlusOutlined, LinkOutlined } from "@ant-design/icons";

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

  const dateCol = () => {
    return {
      title: "Created",
      dataIndex: "created_date",
      key: "created_date",
      align: "center",
      width: 112,
    };
  };
  const nameCol = () => {
    return {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
      render: name => <Typography.Text>{name}</Typography.Text>,
    };
  };
  const creatorCol = () => {
    return {
      title: "Creator",
      dataIndex: "creator",
      key: "creator",
      align: "center",
      render: creator => (
        <><Address address={creator} fontSize="14pt" ensProvider={mainnetProvider} blockExplorer={blockExplorer} /></>
      ),
    };
  };
  const votedCol = () => {
    return {
      title: "№ Voted",
      dataIndex: "n_voted",
      key: "n_voted",
      align: "center",
      width: 100,
      render: p => (
        <Typography.Text>
          {p.n_voted} / {p.outOf}
        </Typography.Text>
      ),
    };
  };
  const statusCol = () => {
    return {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 100,
      render: status => (status ? <Tag color={"lime"}>open</Tag> : <Tag>closed</Tag>),
    };
  };
  const tagsCol = () => {
    return {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      align: "center",
      render: tags =>
        tags.map(r => {
          let color = "orange";
          if (r == "candidate") {
            color = "blue";
          }
          if (r === "voted") {
            color = "green";
          }
          return (
            <Tag color={color} key={r}>
              {r.toLowerCase()}
            </Tag>
          );
        }),
    };
  };
  const actionCol = () => {
    return {
      title: "Action",
      key: "action",
      align: "center",
      width: 100,
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button type="link" icon={<LinkOutlined />} size="small" shape="round" onClick={() => viewElection(index)}>
              View
            </Button>
          </Space>
        </>
      ),
    };
  };

  const columns = [dateCol(), nameCol(), creatorCol(), votedCol(), tagsCol(), statusCol(), actionCol()];

  const routeHistory = useHistory();

  const viewElection = index => {
    console.log({ index });
    routeHistory.push("/voting/" + index);
  };

  const createElection = () => {
    routeHistory.push("/create");
  };

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
      }
    }
  }, [readContracts, address]);

  const init = async () => {
    const newElectionsMap = new Map();
    const numElections = await readContracts.Diplomacy.numElections();

    for (let i = 0; i < numElections; i++) {
      const election = await readContracts.Diplomacy.getElectionById(i);
      console.log({ election });

      const electionVoted = await readContracts.Diplomacy.getElectionVoted(i);
      const hasVoted = await readContracts.Diplomacy.hasVoted(i, address);

      const tags = [];
      if (election.admin === address) {
        tags.push("admin");
      }
      if (election.candidates.includes(address)) {
        tags.push("candidate");
      }
      if (hasVoted) {
        tags.push("voted");
      }
      let status = election.isActive;

      let created = new Date(election.createdAt.toNumber() * 1000).toISOString().substring(0, 10);
      let electionEntry = {
        created_date: created,
        name: election.name,
        creator: election.admin,
        n_voted: { n_voted: electionVoted.toNumber(), outOf: election.candidates.length },
        status: status,
        tags: tags,
      };

      newElectionsMap.set(i, electionEntry);
    }

    addEventListener("Diplomacy", "BallotCast", onBallotCast, newElectionsMap);
    addEventListener("Diplomacy", "ElectionCreated", onElectionCreated, newElectionsMap);

    setElectionsMap(newElectionsMap);
  };

  const addEventListener = async (contractName, eventName, callback, electionsMap) => {
    await readContracts[contractName].removeListener(eventName);
    readContracts[contractName].on(eventName, (...args) => {
      let msg = args.pop().args;
      callback(msg, electionsMap);
    });
  };

  const onBallotCast = async (msg, electionsMap) => {
    console.log("onBallotCast ", msg.electionId.toNumber(), electionsMap[0]);
    if (electionsMap[msg.electionId.toNumber()] !== undefined) {
      let electionEntry = electionsMap[msg.electionId.toNumber()];
      const electionVoted = await readContracts.Diplomacy.getElectionVoted(i);
      electionEntry.n_voted = { n_voted: electionVoted.toNumber(), outOf: election.candidates.length };
      electionsMap.set(msg.electionId.toNumber(), electionEntry);
      setElectionsMap(electionsMap);
      console.log("updated ballot cast");
    }
  };

  const onElectionCreated = async (msg, electionsMap) => {
    console.log("onElectionCreated ", msg);
    if (!electionsMap[msg.electionId.toNumber()]) {
      addNewElectionToTable(msg.electionId.toNumber(), electionsMap);
    }
  };

  const addNewElectionToTable = async (i, electionsMap) => {
    const election = await readContracts.Diplomacy.getElectionById(i);
    console.log({ election });

    const electionVoted = await readContracts.Diplomacy.getElectionVoted(i);
    const hasVoted = await readContracts.Diplomacy.hasVoted(i, address);

    const tags = [];
    if (election.admin === address) {
      tags.push("admin");
    }
    if (election.candidates.includes(address)) {
      tags.push("candidate");
    }
    if (hasVoted) {
      tags.push("voted");
    }
    let status = election.isActive;

    let created = new Date(election.createdAt.toNumber() * 1000).toISOString().substring(0, 10);
    let electionEntry = {
      created_date: created,
      name: election.name,
      creator: election.admin,
      n_voted: { n_voted: electionVoted.toNumber(), outOf: election.candidates.length },
      status: status,
      tags: tags,
    };

    electionsMap.set(i, electionEntry);

    setElectionsMap(electionsMap);
  };

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
            <Button
              icon={<PlusOutlined />}
              type="primary"
              size="large"
              shape="round"
              style={{ margin: 4 }}
              onClick={createElection}
            >
              Create Election
            </Button>,
          ]}
        />
        {electionsMap && (
          <Table
            bordered
            size="middle"
            dataSource={Array.from(electionsMap.values())}
            columns={columns}
            pagination={false}
            scroll={{ y: 800 }}
            style={{ padding: 10 }}
          />
        )}
      </div>
    </>
  );
}
