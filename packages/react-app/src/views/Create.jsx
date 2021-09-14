import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useEventListener } from "../hooks";
import { Address } from "../components";
import { mainnetProvider, blockExplorer } from "../App";
import { fromWei, toWei, toBN } from "web3-utils";
import AddressInput from "../components/AddressInput";
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
} from "antd";

const CURRENCY = "MATIC";

const Step1 = (props,
// `{
//   mainnetProvider,
//   // electionCandidates,
//   // electionName,
//   // electionFunds,
//   // electionFundAmount,
//   // electionVotes,
//   // electionTokenAdr,
//   // electionTokenName,
// }`
) => {
  console.log({props})
  const [electionName, setElectionName] = useState("");
  const [electionFunds, setElectionFunds] = useState(CURRENCY);
  const [electionFundAmount, setElectionFundAmount] = useState("");
  const [electionVotes, setElectionVotes] = useState("");
  const [electionTokenAdr, setElectionTokenAdr] = useState("0x0000000000000000000000000000000000000000");
  const [electionTokenName, setElectionTokenName] = useState("");

  const selectFunds = (
    <Select
      defaultValue={CURRENCY}
      className="select-funds-type"
      onChange={value => {
        // GTC-MATIC (PoS) TOKEN ADDRESS!
        const adr = "0xdb95f9188479575F3F718a245EcA1B3BF74567EC";
        setElectionTokenAdr(adr);
        setElectionFunds(value);
      }}
    >
      <Option value={CURRENCY}>{CURRENCY}</Option>
      {/* <Option value={electionTokenName}>{electionTokenName}</Option> */}
      <Option value="GTC">GTC</Option>
    </Select>
  );
  return (
    <>
      <Form layout="vertical" name="createForm" autoComplete="off" initialValues={{ remember: false }}>
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
              e.target.value ? setElectionName(e.target.value) : null;
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
                let funds;
                if (electionFunds === CURRENCY) {
                  funds = toWei(Number(e.target.value).toFixed(18).toString());
                } else {
                  funds = toWei(Number(e.target.value).toFixed(18).toString()); //*10^18 for Tokens?? -> toWei does this, but hacky
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
              // setNewElecAllocatedVotes(value);
            }}
          />
        </Form.Item>
      </Form>
    </>
  );
};

const Step2 = ({
  mainnetProvider,
  electionCandidates,
  electionName,
  electionFunds,
  electionFundAmount,
  electionVotes,
  electionTokenAdr,
  electionTokenName,
}) => {
  const [toAddress, setToAddress] = useState("");
  return (
    <>
      <Form layout="vertical" name="createForm" autoComplete="off" initialValues={{ remember: false }}>
        <Form.Item
          name="candidates"
          label="Candidates"
          rules={[
            {
              validator: (_, value) =>
                electionCandidates.length != 0
                  ? Promise.resolve()
                  : Promise.reject(new Error("Should add atleast one ENS address")),
            },
          ]}
        >
          <Space>
            <AddressInput
              ensProvider={mainnetProvider}
              placeholder="Enter ENS name"
              value={toAddress}
              onChange={setToAddress}
            />
            <Button
              type="default"
              size="large"
              onClick={() => {
                electionCandidates.push(toAddress);
                setToAddress("");
              }}
            >
              + Add
            </Button>
          </Space>

          <List
            style={{ overflow: "auto", height: "200px" }}
            itemLayout="horizontal"
            bordered
            dataSource={electionCandidates}
            renderItem={(item, index) => (
              <List.Item>
                <Address address={item} ensProvider={mainnetProvider} fontSize="14pt" />
                <Button
                  type="link"
                  onClick={async () => {
                    const updatedAddresses = [...addresses];
                    updatedAddresses.splice(index, 1);
                    setElectionCandidates(updatedAddresses);
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

const Step3 = ({
  mainnetProvider,
  electionCandidates,
  electionName,
  electionFunds,
  electionFundAmount,
  electionVotes,
  electionTokenAdr,
  electionTokenName,
}) => {
  return (
    <>
      <Descriptions title="Election Details" column={1} size="small" bordered>
        <Descriptions.Item label="Name">{electionName}</Descriptions.Item>
        <Descriptions.Item label="Allocated Funds">
          {/* {fromWei(newElecAllocatedFunds ? newElecAllocatedFunds.toString() : "0") + " " + fundsType} */}
        </Descriptions.Item>
        {/* <Descriptions.Item label="Allocated Funds">{newElecAllocatedFunds}</Descriptions.Item> */}
        <Descriptions.Item label="Votes/Candidate">{10000}</Descriptions.Item>
        <Descriptions.Item label="Candidates">
          <List
            style={{ overflow: "auto", height: "100px" }}
            itemLayout="horizontal"
            bordered
            dataSource={electionCandidates}
            renderItem={(adr, index) => (
              <List.Item>
                <Address address={adr} ensProvider={mainnetProvider} fontSize="14pt" />
              </List.Item>
            )}
          />
        </Descriptions.Item>
      </Descriptions>
      <Form>
        <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
          <Button type="primary" size="large" htmlType="submit">
            Confirm
          </Button>
        </Form.Item>
      </Form>
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

  const [electionCandidates, setElectionCandidates] = useState([]);
  const [electionName, setElectionName] = useState("");
  const [electionFunds, setElectionFunds] = useState(CURRENCY);
  const [electionFundAmount, setElectionFundAmount] = useState("");
  const [electionVotes, setElectionVotes] = useState("");
  const [electionTokenAdr, setElectionTokenAdr] = useState("0x0000000000000000000000000000000000000000");
  const [electionTokenName, setElectionTokenName] = useState("");

  const { Step } = Steps;

  const steps = [
    {
      title: "Election Numbers",
      content: (
        <Step1
          mainnetProvider={mainnetProvider}
          
          // electionCandidates={electionCandidates}
          // electionName={electionName}
          // electionFunds={electionFunds}
          // electionFundAmount={electionFundAmount}
          // electionVotes={electionVotes}
          // electionTokenAdr={electionTokenAdr}
          // electionTokenName={electionTokenName}
        />
      ),
    },
    {
      title: "Add Candidates",
      content: (
        <Step2
          mainnetProvider={mainnetProvider}
          electionCandidates={electionCandidates}
          electionName={electionName}
          electionFunds={electionFunds}
          electionFundAmount={electionFundAmount}
          electionVotes={electionVotes}
          electionTokenAdr={electionTokenAdr}
          electionTokenName={electionTokenName}
        />
      ),
    },
    {
      title: "Review & Confirm",
      content: (
        <Step3
          mainnetProvider={mainnetProvider}
          electionCandidates={electionCandidates}
          electionName={electionName}
          electionFunds={electionFunds}
          electionFundAmount={electionFundAmount}
          electionVotes={electionVotes}
          electionTokenAdr={electionTokenAdr}
          electionTokenName={electionTokenName}
        />
      ),
    },
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  return (
    <>
      <div
        className="create-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}
      >
        <PageHeader
          ghost={false}
          title="Create New Election"
          onBack={() => window.history.back()}
          extra={
            [
              // <Button type="primary" size="large" shape="round" style={{ margin: 4 }} onClick={() => createNewElection()}>
              //   + Create Election
              // </Button>,
            ]
          }
        />
        <Divider />

        <Steps current={current}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div className="steps-content">{steps[current].content}</div>
        <div className="steps-action">
          {current > 0 && (
            <Button style={{ margin: "0 8px" }} onClick={() => prev()}>
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => message.success("Processing complete!")}>
              Done
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
