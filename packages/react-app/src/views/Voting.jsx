import { PageHeader } from "antd";
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button, Divider, Table, Space } from "antd";
import { fromWei, toWei, toBN } from "web3-utils";
import { Address, PayButton } from "../components";

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
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [token, setToken] = useState("ETH");
  const [election, setElection] = useState();
  const [elecName, setElecName] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalFunds, setTotalFunds] = useState(0);
  const [remainTokens, setRemainTokens] = useState(0);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [canEndElection, setCanEndElection] = useState(false);
  const [canVoteElection, setCanVoteElection] = useState(false);
  const [isElectionActive, setIsElectionActive] = useState(false);
  const [isElecPayoutComplete, setIsElecPayoutComplete] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [fundType, setFundType] = useState("");
  const [erc20, setErc20] = useState([]);
  //pay button
  const [availableTokens, setAvailableTokens] = useState([]);
  const [amount, setAmount] = useState(0);
  const [spender, setSpender] = useState("");

  const voting_columns = [
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: address => (
        <Address address={address} fontSize="14pt" ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
      ),
    },
    {
      title: "# Votes",
      dataIndex: "n_votes",
      key: "n_votes",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button type="default" size="small" onClick={() => plusVote(index)}>
              ➕
            </Button>
            <Button type="default" size="small" onClick={() => minusVote(index)}>
              ➖
            </Button>
          </Space>
        </>
      ),
    },
  ];

  const voted_columns = [
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: address => (
        <Address address={address} fontSize="14pt" ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
      ),
    },
    {
      title: "Current Score",
      dataIndex: "score",
      key: "score",
    },
    {
      title: "Payout Distribution",
      dataIndex: "payout",
      key: "payout",
      render: payout => {
        let ethToPay = fromWei(payout.toString(), "ether");
        ethToPay = parseFloat(ethToPay).toFixed(3);
        return (
          <>
            {ethToPay} {fundType}
          </>
        );
      },
    },
  ];

  function minusVote(idx) {
    if (tableDataSrc[idx].n_votes > 0) {
      tableDataSrc[idx].n_votes = tableDataSrc[idx].n_votes - 1;
      setRemainTokens(remainTokens + 1);
    }
  }

  function plusVote(idx) {
    if (remainTokens > 0) {
      tableDataSrc[idx].n_votes = tableDataSrc[idx].n_votes + 1;
      setRemainTokens(remainTokens - 1);
    }
  }

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
        setSpender(readContracts?.Diplomacy?.address);
        console.log({ address });
      }
    }
  }, [readContracts]);

  useEffect(() => {
    if (!election) return;
    let fundingType = "ETH";
    if (election.token != "0x0000000000000000000000000000000000000000") {
      fundingType = getTokenName(election.token);
      console.log({ fundingType });
    }
    setToken(fundingType);
    setFundType(fundingType);
  }, [election, erc20]);

  const init = async () => {
    updateView();
    let contractName = "Diplomacy";
    addEventListener(contractName, "BallotCast", onBallotCast);
    addEventListener(contractName, "ElectionEnded", onElectionEnded);
    addEventListener(contractName, "ElectionPaid", onElectionPaid);
    // console.log("added event listeners");

    const erc20List = Object.keys(readContracts).reduce((acc, contract) => {
      if (typeof readContracts[contract].decimals !== "undefined") {
        acc.push(contract);
      }
      return acc;
    }, []);
    setErc20(erc20List);
  };

  const addEventListener = async (contractName, eventName, callback) => {
    await readContracts[contractName].removeListener(eventName);
    readContracts[contractName].on(eventName, (...args) => {
      let eventBlockNum = args[args.length - 1].blockNumber;
      if (eventBlockNum >= localProvider._lastBlockNumber) {
        let msg = args.pop().args;
        callback(msg);
      }
    });
  };

  function onBallotCast(msg) {
    console.log("onBallotCast ");
    if (alreadyVoted || msg.voter == address) {
      updateView();
      setIsVoting(false);
    }
  }

  function onElectionEnded(msg) {
    console.log("onElectionEnded");
    updateView();
  }

  function onElectionPaid(msg) {
    console.log("onElectionPaid");
    updateView();
  }

  function getTokenName(tokenAddress) {
    return erc20.find(tokenName => {
      const taddress = readContracts[tokenName].address;
      if (taddress == tokenAddress) {
        return tokenName;
      }
    });
  }

  const updateView = async () => {
    const election = await readContracts.Diplomacy.getElectionById(id);
    console.log({ election });
    setElection(election);
    const isCreator = election.admin == address;
    const electionCandidates = election.candidates;
    const isCandidate = electionCandidates.includes(address);
    console.log(isCandidate, address);
    setCanVoteElection(isCandidate);
    setCanEndElection(isCreator);
    setIsElectionActive(election.isActive);
    setIsElecPayoutComplete(election.paid);

    const funds = election.funds;
    const ethFund = fromWei(funds.toString(), "ether");
    setAmount(ethFund);
    setTotalFunds(ethFund);
    setElecName(election.name);
    // console.log("setTotalVotes ", election.votes.toNumber());
    setTotalVotes(election.votes.toNumber());
    const hasVoted = await readContracts.Diplomacy.hasVoted(id, address);
    setAlreadyVoted(hasVoted);
    if (!hasVoted) {
      setRemainTokens(election.votes.toNumber());
    }

    // console.log("electionCandidates ", electionCandidates);
    let data = [];

    for (let i = 0; i < electionCandidates.length; i++) {
      const addr = electionCandidates[i];
      const scores = await readContracts.Diplomacy.getElectionScores(id, addr);
      let scoresSum =
        scores.length > 0
          ? scores
              .map(Number)
              .reduce((a, b) => {
                return a + b;
              })
              .toFixed(4)
          : "0";
      let weiToPay = 0;
      data.push({ key: i, address: addr, n_votes: 0, score: scoresSum, payout: weiToPay });
    }

    let payoutInfo = await calculatePayout();
    payoutInfo.payout.forEach((p, i) => {
      data[i].payout = p;
    });

    console.log("updateView called");
    setTableDataSrc(data);
  };

  const castVotes = async () => {
    console.log("castVotes");
    setIsVoting(true);
    const election = await readContracts.Diplomacy.getElectionById(id);
    const adrs = election.candidates; // hmm...
    const votes = [];
    for (let i = 0; i < tableDataSrc.length; i++) {
      votes.push(Math.sqrt(tableDataSrc[i].n_votes).toString());
    }

    const result = tx(writeContracts.Diplomacy.castBallot(id, adrs, votes), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      } else {
        console.log("update error ", update.status);
        setIsVoting(false);
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
    // updateView();
  };

  //////
  const [payoutInfo, setPayoutInfo] = useState({ candidates: null, payout: null });

  const calculatePayout = async () => {
    const election = await readContracts.Diplomacy.getElectionById(id);

    // console.log({election})

    const electionFundsEth = Number(fromWei(election.funds.toString(), "ether"));
    // console.log({electionFundsEth})

    let electionScoresSum = 0;

    let candidates = [];
    let sqrdSumScore = [];
    let payoutRatio = [];
    let ethToPay = [];

    for (let i = 0; i < election.candidates.length; i++) {
      let candidate = election.candidates[i];
      // console.log({candidate});

      let candidateScores = await readContracts.Diplomacy.getElectionScores(id, candidate);
      // console.log({candidateScores});

      let candidateSqrdSumScore = Math.pow(
        candidateScores.map(Number).reduce((x, y) => {
          return x + y;
        }, 0),
        2,
      );
      // console.log({candidateSqrdSumScore});

      electionScoresSum += candidateSqrdSumScore;

      candidates.push(candidate);
      sqrdSumScore.push(candidateSqrdSumScore);
    }

    payoutRatio = sqrdSumScore.map(d => {
      if (electionScoresSum == 0) {
        return 0;
      }
      return d / electionScoresSum; // Should election score sum be squared as well?
    });
    // console.log({ payoutRatio });

    // NOTE: Borked: Payout is rounding in a funky way, breaking the validator contract-side
    ethToPay = payoutRatio.map(d => {
      return electionFundsEth * d;
    });
    console.log({ ethToPay });

    payoutInfo.candidates = candidates;
    payoutInfo.payout = ethToPay.map(String).map(d => {
      let d_num = Number(d);
      d_num = d_num.toFixed(10);
      return toWei(d_num);
    }, 0);

    // setPayoutInfo(candidatesPayoutInfo);
    // console.log({ payoutInfo });
    return payoutInfo;
  };

  const endElection = async () => {
    calculatePayout();
    console.log("endElection");
    const result = tx(writeContracts.Diplomacy.endElection(id), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
  };

  const ethPayHandler = async () => {
    tx(
      writeContracts.Diplomacy.payoutElection(id, payoutInfo.candidates, payoutInfo.payout, {
        value: election.funds,
        gasLimit: 12450000,
      }),
    );
  };

  const tokenPayHandler = async opts => {
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
          title={elecName}
          extra={[
            canEndElection && isElectionActive && (
              <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => endElection()}>
                End
              </Button>
            ),
            // <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => payoutTokens()}>
            //   💸 Payout
            // </Button>,
            canEndElection && !isElectionActive && !isElecPayoutComplete && (
              <PayButton
                style={{ marginTop: 20 }}
                token={token}
                appName="D-Tips"
                tokenListHandler={tokens => setAvailableTokens(tokens)}
                callerAddress={address}
                maxApproval={amount}
                amount={amount}
                spender={spender}
                yourLocalBalance={yourLocalBalance}
                readContracts={readContracts}
                writeContracts={writeContracts}
                ethPayHandler={ethPayHandler}
                tokenPayHandler={tokenPayHandler}
              />
            ),
            isElectionActive && !alreadyVoted && canVoteElection && (
              <Button type="primary" size="large" style={{ margin: 4 }} onClick={() => castVotes()} loading={isVoting}>
                🗳️ Vote
              </Button>
            ),
          ]}
        >
          <h2>Election: {elecName}</h2>
          <Space split={<Divider type="vertical" />}>
            <h3>
              Total funds to distribute: {Number(totalFunds).toFixed(3)} {fundType}
            </h3>
            <h3>Votes remaining: {remainTokens}</h3>
            <h3>
              Status: {isElectionActive && <span>Active</span>}
              {!isElectionActive && <span>Inactive</span>}
            </h3>
          </Space>
          <Divider />
          {isElectionActive && canVoteElection && !alreadyVoted && (
            <Table dataSource={tableDataSrc} columns={voting_columns} pagination={{ pageSize: 5 }} />
          )}
          {(!canVoteElection || alreadyVoted || !isElectionActive) && (
            <Table dataSource={tableDataSrc} columns={voted_columns} pagination={{ pageSize: 5 }} />
          )}
          <Divider />
          {alreadyVoted && <h3>Votes Received! Thanks!</h3>}
        </PageHeader>
      </div>
    </>
  );
}
