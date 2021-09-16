import { PageHeader } from "antd";
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button, Divider, Table, Space, Typography, Input } from "antd";
import { fromWei, toWei, toBN, numberToHex } from "web3-utils";
import { Address, PayButton } from "../components";
import { PlusSquareOutlined, MinusSquareOutlined, SendOutlined, CloseCircleOutlined } from "@ant-design/icons";

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
  const [electionScoreFactor, setElectionScoreFactor] = useState();
  const [canVote, setCanVote] = useState(false);
  const [isElectionAdmin, setIsElectionAdmin] = useState(true);
  const [isElectionActive, setIsElectionActive] = useState(false);
  const [isElectionPaid, setIsElectionPaid] = useState(false);

  const [availableTokens, setAvailableTokens] = useState([]);
  const [token, setToken] = useState("ETH");
  const [electionFundingAmount, setElectionFundingAmount] = useState(0);
  const [spender, setSpender] = useState("");

  const addEventListener = async (contractName, eventName, callback, electionsMap) => {
    await readContracts[contractName].removeListener(eventName);
    readContracts[contractName].on(eventName, (...args) => {
      let msg = args.pop().args;
      callback(msg, electionsMap);
    });
  };

  const init = async () => {
    const loadedElection = await readContracts.Diplomacy.getElectionById(id);
    const SCORE_FACTOR = await readContracts.Diplomacy.electionScoreFactor();
    const votedStatus = await readContracts.Diplomacy.hasVoted(id, address);

    const isCreator = loadedElection.admin == address;
    const isCandidate = loadedElection.candidates.includes(address);

    setIsElectionActive(loadedElection.active);
    setIsElectionPaid(loadedElection.paid);

    if (loadedElection.admin == address) {
      setIsElectionAdmin(true);
    }
    if (!votedStatus && isCandidate) {
      setCanVote(true);
    }

    const funds = loadedElection.funds;
    const ethFund = fromWei(funds.toString(), "ether");
    setElectionFundingAmount(ethFund);

    setElectionScoreFactor(SCORE_FACTOR);
    setElection(loadedElection);
    setSpender(readContracts?.Diplomacy?.address);
    // addEventListener("Diplomacy", "BallotCast", onBallotCast, election);
    // addEventListener("Diplomacy", "ElectionEnded", onElectionEnded);
    // addEventListener("Diplomacy", "ElectionPaid", onElectionPaid);
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
    if (candidate.votes > 0) {
      candidate.votes = candidate.votes - 1;
      candidate.score = (candidate.votes ** 0.5).toFixed(2);
      candidateMap.set(addr, candidate);
      setMyVotes(myVotes + 1);
      // setScoreSum(scoreSum - candidate.score);
    }
    console.log(candidate);
  };

  const addVote = addr => {
    const candidate = candidateMap.get(addr);
    if (candidate.votes < election.votes && myVotes > 0) {
      candidate.votes = candidate.votes + 1;
      candidate.score = (candidate.votes ** 0.5).toFixed(2);
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
      title: "Quadratic Score",
      key: "percentage",
      render: (text, record, index) => (
        <>{Math.floor(candidateMap.get(text.address).score * 10 ** electionScoreFactor)}</>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button
              icon={<PlusSquareOutlined />}
              type="link"
              size="large"
              onClick={() => addVote(text.address)}
            ></Button>
            <Typography.Title level={4} style={{ margin: "0.1em" }}>
              {candidateMap.get(text.address).votes}
            </Typography.Title>
            <Button
              icon={<MinusSquareOutlined />}
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

  const [isElectionEnding, setIsElectionEnding] = useState(false);
  const endElection = async () => {
    console.log("endElection");
    setIsElectionEnding(true);
    const result = tx(writeContracts.Diplomacy.endElection(id), update => {
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
        setIsElectionEnding(false);
        setIsElectionActive(false);
      } else {
        setIsElectionEnding(false);
        console.log(update.message);
        return;
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
  };

  const [isElectionPaying, setIsElectionPaying] = useState(false);
  const ethPayHandler = async () => {
    setIsElectionPaying(true);

    const value = toWei(electionFundingAmount);
    const adrs = Array.from(candidateMap.keys());
    const pay = [];
    const electionScoreSum = await readContracts.Diplomacy.electionScoreSum(id);
    for (let i = 0; i < adrs.length; i++) {
      const candidateScore = await readContracts.Diplomacy.getElectionScore(id, adrs[i]);
      const candidatePay = ((candidateScore.toNumber() / electionScoreSum.toNumber()) * value).toString();
      pay.push(candidatePay); 
    }

    console.log(adrs, pay)

    const result = tx(
      writeContracts.Diplomacy.payoutElection(id, adrs, pay, {
        value: value,
        gasLimit: 12450000,
      }),
      update => {
        if (update && update.code == 4001) {
          setIsElectionPaying(false);
          console.log(update.message);
          return;
        }
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
        } else if (update.status === 0) {
          setIsElectionPaying(false);
          return;
        }
      },
    );
  };

  const tokenPayHandler = async opts => {
    setIsElectionPaying(true);
    console.log(opts);
    console.log({ payoutInfo });
    const election = await readContracts.Diplomacy.getElectionById(id);
    console.log({ election });

    tx(
      writeContracts.Diplomacy.payoutElection(id, payoutInfo.candidates, payoutInfo.payout, {
        gasLimit: 12450000,
      }),
    );
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
          extra={[
            // isElectionActive && isElectionAdmin && (
              <Button
                icon={<CloseCircleOutlined />}
                type="danger"
                size="large"
                shape="round"
                style={{ margin: 4 }}
                onClick={() => endElection()}
                loading={isElectionEnding}
              >
                End
              </Button>,
            // ),
            !isElectionActive && isElectionAdmin && !isElectionPaid && (
              <PayButton
                token={token}
                appName="Quadratic Diplomacy"
                tokenListHandler={tokens => setAvailableTokens(tokens)}
                callerAddress={address}
                maxApproval={electionFundingAmount}
                amount={electionFundingAmount}
                spender={spender}
                yourLocalBalance={yourLocalBalance}
                readContracts={readContracts}
                writeContracts={writeContracts}
                ethPayHandler={ethPayHandler}
                tokenPayHandler={tokenPayHandler}
              />
            ),
          ]}
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
                onMouseEnter: event => {}, // mouse enter row
                onMouseLeave: event => {}, // mouse leave row
              };
            }}
          />
          <Divider />
          {canVote && (
            <Button
              icon={<SendOutlined />}
              size="large"
              shape="round"
              type="primary"
              onClick={() => {
                console.log("casting ballot");

                const candidates = Array.from(candidateMap.keys());
                const scores = [];
                candidateMap.forEach(d => {
                  scores.push(Math.floor(d.score * (10 ** electionScoreFactor)));
                });
                console.log(candidates, scores);

                const result = tx(writeContracts.Diplomacy.castBallot(id, candidates, scores), update => {
                  console.log("📡 Transaction Update:", update);
                  if (update && (update.status === "confirmed" || update.status === 1)) {
                    console.log(" 🍾 Transaction " + update.hash + " finished!");
                  } else {
                    console.log("update error ", update.status);
                  }
                });
              }}
            >
              Confrim Votes
            </Button>
          )}
        </PageHeader>
      </div>
    </>
  );
}
