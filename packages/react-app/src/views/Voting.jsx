import { PageHeader } from "antd";
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button, Divider, Table, Space, Typography, Input } from "antd";
import { fromWei, toWei, toBN, numberToHex } from "web3-utils";
import { Address, PayButton } from "../components";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

var Map = require("collections/map");

export default function Voting({
  address,
  mainnetProvider,
  blockExplorer,
  localProvider,
  tx,
  readContracts,
  writeContracts,
  yourLocalBalance,
}) {
  let { id } = useParams();

  const [election, setElection] = useState({});
  const [candidateMap, setCandidateMap] = useState();

  const addEventListener = async (contractName, eventName, callback, electionsMap) => {
    await readContracts[contractName].removeListener(eventName);
    readContracts[contractName].on(eventName, (...args) => {
      let msg = args.pop().args;
      callback(msg, electionsMap);
    });
  };

  const init = async () => {
    const loadedElection = await readContracts.Diplomacy.getElectionById(id);
    setElection(loadedElection);
    addEventListener("Diplomacy", "BallotCast", onBallotCast, election);
  };

  const onBallotCast = async (msg, election) => {
    console.log("onBallotCast ", msg);
  };

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
      }
    }
  }, [readContracts]);

  useEffect(() => {
    updateTable();

    if (election.candidates) {
      const mapping = new Map();
      for (let i = 0; i < election.candidates.length; i++) {
        mapping.set(election.candidates[i], { votes: 0, score: 0 });
      }
      setCandidateMap(mapping);
    }

    setMyVotes(election.votes);
  }, [election]);

  const [votingData, setVotingData] = useState([]);

  const [myVotes, setMyVotes] = useState(election.votes);
  const [scoreSum, setScoreSum] = useState(0);

  const minusVote = addr => {
    const candidate = candidateMap.get(addr);
    if ( candidate.votes > 0 ) {
      candidate.votes = candidate.votes - 1;
      candidate.score = (candidate.votes ** 0.5).toFixed(7); 
      candidateMap.set(addr, candidate);
      setMyVotes(myVotes + 1);
      // setScoreSum(scoreSum - candidate.score);
    }
    console.log(candidate);
  };

  const addVote = addr => {
    const candidate = candidateMap.get(addr);
    if ( candidate.votes < election.votes && myVotes > 0 ) {
      candidate.votes = candidate.votes + 1
      candidate.score = (candidate.votes ** 0.5).toFixed(7);
      candidateMap.set(addr, candidate);
      setMyVotes(myVotes - 1);
      // setScoreSum(scoreSum + candidate.score);
    }
    console.log(candidate);
  };

  const tableCols = [
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: address => (
        <Address address={address} fontSize="14pt" ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
      ),
    },
    {
      title: "Quadratic %", 
      key: "percentage",
      render: (text, record, index) => (
        <>
        {candidateMap.get(text.address).score}
        </>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button
              icon={<PlusCircleOutlined />}
              type="link"
              size="large"
              onClick={() => addVote(text.address)}
            ></Button>
            {<Input bordered={false} value={candidateMap.get(text.address).votes} />}
            <Button
              icon={<MinusCircleOutlined />}
              type="link"
              size="large"
              onClick={() => minusVote(text.address)}
            ></Button>
          </Space>
        </>
      ),
    },
  ];

  const updateTable = async () => {
    let data = [];
    if (election.candidates) {
      for (let i = 0; i < election.candidates.length; i++) {
        const addr = election.candidates[i];
        data.push({ key: i, address: addr });
      }
    }
    setVotingData(data);
  };

  return (
    <>
      <div
        className="voting-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 900, margin: "auto", marginTop: 64 }}
      >
        <PageHeader
          ghost={false}
          onBack={() => window.history.back()}
          title={election ? election.name : "Loading Election..."}
        >
          My Votes: {myVotes}
          <Table
            dataSource={votingData}
            columns={tableCols}
            pagination={false}
            onRow={(record, rowIndex) => {
              return {
                onClick: event => {}, // click row
                onDoubleClick: event => {}, // double click row
                onContextMenu: event => {}, // right button click row
                onMouseEnter: event => {
                  // console.log("set votes to " + voteView)
                  // setMyVotes(voteView)
                }, // mouse enter row
                onMouseLeave: event => {
                  // setVoteView(myVotes)
                  // setMyVotes(voteView)
                  // console.log(record);
                  // setMyVotes(temp);
                  // setMyVotes(temp);
                }, // mouse leave row
              };
            }}
          />
          <Divider />
          <Button size="large" shape="round" type="primary"> Confrim Votes </Button>
        </PageHeader>
      </div>
    </>
  );
}
