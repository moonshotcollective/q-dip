import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useEventListener } from "../hooks";
import { Address } from "../components";
import { mainnetProvider, blockExplorer } from "../App";
import { fromWei, toWei, toBN } from "web3-utils";
import AddAddress from "../components/AddAddress";
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
  Steps,
  Col,
  Row,
} from "antd";
import {
  LeftOutlined,
  DeleteOutlined,
  CheckOutlined,
  PlusOutlined,
  PlusCircleFilled,
  ExportOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons";

const CURRENCY = "MATIC";

const Step1 = ({ mainnetProvider, election }) => {
  const selectFunds = (
    <Select
      defaultValue={CURRENCY}
      className="select-funds-type"
      onChange={value => {
        // GTC-MATIC (PoS) TOKEN ADDRESS!
        const adr = "0xdb95f9188479575F3F718a245EcA1B3BF74567EC";
        election.tokenAdr = adr;
        election.fundAmount = value;
      }}
    >
      <Option value={CURRENCY}>{CURRENCY}</Option>
      {/* <Option value={electionTokenName}>{electionTokenName}</Option> */}
      <Option value="GTC">GTC</Option>
    </Select>
  );

  return (
    <>
      <Form
        layout="vertical"
        style={{ margin: "2em 12em" }}
        name="createForm"
        autoComplete="off"
        initialValues={{ remember: true }}
      >
        <Form.Item
          name="elec_name"
          label="Election Name"
          rules={[{ required: true, message: "Please input election name!" }]}
        >
          <Input
            size="large"
            placeholder="Enter Name"
            allowClear={true}
            style={{
              width: "100%",
            }}
            onChange={e => {
              election.name = e.target.value ? e.target.value : "";
            }}
          />
        </Form.Item>

        <Form.Item
          name="funds"
          label="Funding Allocation"
          rules={[{ required: true, pattern: new RegExp(/^[.0-9]+$/), message: "Funding is Required!" }]}
        >
          <Input
            addonAfter={selectFunds}
            placeholder="Enter Amount"
            size="large"
            allowClear={true}
            autoComplete="off"
            value={0}
            style={{
              width: "100%",
            }}
            onChange={e => {
              if (!isNaN(Number(e.target.value))) {
                if (election.funds === CURRENCY) {
                  election.fundAmount = toWei(Number(e.target.value).toFixed(18).toString());
                } else {
                  election.fundAmount = toWei(Number(e.target.value).toFixed(18).toString()); //*10^18 for Tokens?? -> toWei does this, but hacky
                }
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="votes"
          label="Vote Delegation"
          rules={[
            { required: true, message: "Please input number of votes!" },
            { pattern: new RegExp(/^[0-9]+$/), message: "Invalid Vote Allocation!" },
          ]}
        >
          <InputNumber
            size="large"
            placeholder="1"
            style={{
              width: "100%",
            }}
            min="1"
            onChange={value => {
              election.votes = value;
            }}
          />
        </Form.Item>
      </Form>
    </>
  );
};

const Step2 = ({ mainnetProvider, election }) => {
  const [toAddress, setToAddress] = useState("");
  return (
    <>
      <Form
        style={{ margin: "2em 12em" }}
        layout="vertical"
        name="createForm"
        autoComplete="off"
        initialValues={{ remember: false }}
      >
        <Form.Item
          name="candidates"
          rules={[
            {
              validator: (_, value) =>
                election.candidates.length != 0
                  ? Promise.resolve()
                  : Promise.reject(new Error("Should add atleast one ENS address")),
            },
          ]}
        >
          <Space style={{ margin: "1em 0em" }}>
            <AddAddress
              ensProvider={mainnetProvider}
              placeholder="Enter ENS name"
              value={toAddress}
              onChange={setToAddress}
            />
            <Button
              className="add-button"
              type="link"
              icon={<PlusCircleFilled />}
              size="large"
              onClick={() => {
                election.candidates.push(toAddress);
                setToAddress("");
              }}
            >
              Add
            </Button>
          </Space>

          <List
            style={{ overflow: "auto", height: "200px" }}
            itemLayout="horizontal"
            bordered
            dataSource={election.candidates}
            renderItem={(item, index) => (
              <List.Item>
                <Address address={item} ensProvider={mainnetProvider} fontSize="14pt" />
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  onClick={async () => {
                    console.log(election.candidates.splice(index, 1));
                    const updatedAddresses = election.candidates;
                    updatedAddresses.splice(index, 1);
                    election.candidates = updatedAddresses;
                  }}
                  size="medium"
                  style={{ marginLeft: "200px" }}
                >
                  Remove
                </Button>
              </List.Item>
            )}
          />
        </Form.Item>
      </Form>
    </>
  );
};

const Step3 = ({ mainnetProvider, election }) => {
  return (
    <>
      <Descriptions bordered style={{ margin: "2em 10em" }} column={1} size="small">
        <Descriptions.Item label="Election Name:">{election.name}</Descriptions.Item>
        <Descriptions.Item label="Allocated Funds:">
          {fromWei(election.fundAmount ? election.fundAmount.toString() : "0") + " " + election.funds}
        </Descriptions.Item>
        <Descriptions.Item label="Delegated Votes:">{election.votes}</Descriptions.Item>
        <Descriptions.Item label="Candidates:">
          Count: {election.candidates.length}
          <br />
          <List
            style={{ overflow: "auto", height: "10em", width: "36em" }}
            itemLayout="horizontal"
            bordered
            dataSource={election.candidates}
            renderItem={(adr, index) => (
              <List.Item>
                <Address address={adr} ensProvider={mainnetProvider} fontSize="14pt" />
              </List.Item>
            )}
          />
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default function Create({
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
  const [current, setCurrent] = useState(0);

  const [newElection, setNewElection] = useState({
    name: "",
    funds: "",
    fundAmount: "",
    votes: 1,
    tokenAdr: "0x0000000000000000000000000000000000000000",
    tokenName: "",
    candidates: [],
  });

  const { Step } = Steps;

  const steps = [
    {
      title: "Election Details",
      content: <Step1 mainnetProvider={mainnetProvider} election={newElection} />,
    },
    {
      title: "Add Candidates",
      content: <Step2 mainnetProvider={mainnetProvider} election={newElection} />,
    },
    {
      title: "Review & Confirm",
      content: <Step3 mainnetProvider={mainnetProvider} election={newElection} />,
    },
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const [isConfirmingElection, setIsConfirmingElection] = useState(false);
  const [isCreatedElection, setIsCreatedElection] = useState(false);

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
      }
    }
  }, [readContracts, address]);

  const init = async () => {
    addEventListener("Diplomacy", "ElectionCreated", onElectionCreated);
  };

  const addEventListener = async (contractName, eventName, callback) => {
    await readContracts[contractName].removeListener(eventName);
    readContracts[contractName].on(eventName, (...args) => {
      callback(args);
    });
  };
  const [electionId, setElectionId] = useState(-1);
  const onElectionCreated = args => {
    console.log(args);
    setElectionId(args[1]);
  };

  const confirmElection = async () => {
    setIsConfirmingElection(true);
    // Create a new election
    const result = tx(
      writeContracts.Diplomacy.newElection(
        newElection.name,
        newElection.fundAmount,
        // fundsType,
        newElection.tokenAdr,
        newElection.votes,
        newElection.candidates,
      ),
      update => {
        console.log("📡 Transaction Update:", update);
        if (update.code == -32603 || update.code == 4001) {
          setIsConfirmingElection(false);
          return;
        }
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
          setIsConfirmingElection(false);
          // update the view!
          setIsCreatedElection(true);
        }
        if (update.status === "error") {
          setIsConfirmingElection(false);
        }
      },
    );
  };

  const routeHistory = useHistory();

  const viewElection = index => {
    console.log({ index });
    routeHistory.push("/voting/" + index);
  };

  return (
    <>
      <div
        className="create-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}
      >
        <PageHeader ghost={false} title="Create New Election" onBack={() => routeHistory.push("/")} />
        <Divider />
        <Steps current={current} style={{ padding: "10px 72px 12px" }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div className="steps-content" style={{ height: "300px" }}>
          {steps[current].content}{" "}
        </div>
        <Divider />
        <div className="steps-action">
          <Row>
            <Col span={4}>
              {current > 0 && !isCreatedElection && (
                <Button type="link" icon={<LeftOutlined />} onClick={() => prev()}>
                  Back
                </Button>
              )}
            </Col>

            <Col span={8} offset={4}>
              {current < steps.length - 1 && (
                <Button icon={<DoubleRightOutlined />} type="default" size="large" shape="round" onClick={() => next()}>
                  Continue
                </Button>
              )}

              {current === steps.length - 1 && !isCreatedElection && (
                <Button
                  icon={<CheckOutlined />}
                  type="primary"
                  size="large"
                  shape="round"
                  loading={isConfirmingElection}
                  onClick={confirmElection}
                >
                  Confirm Election
                </Button>
              )}

              {current === steps.length - 1 && isCreatedElection && (
                <Button
                  icon={<ExportOutlined />}
                  type="default"
                  size="large"
                  shape="round"
                  onClick={() => {
                    viewElection(electionId);
                  }}
                >
                  View Election
                </Button>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}
