import { PageHeader, Carousel, Typography } from "antd";
import { toWei, fromWei } from "web3-utils";
import { Button, Divider, Input, InputNumber, List, Table, Modal, Form, Select, Space, Tag, Descriptions} from "antd";
import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Address, Balance } from "../components";

import { useEventListener, useOnBlock } from "../hooks";
import AddressInput from "../components/AddressInput";

import { mainnetProvider, blockExplorer } from "../App";

import "../index.css";
import 'antd/dist/antd.css';

const { Option } = Select;

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
  const [numElections, setNumElections] = useState(0);
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [newElecName, setNewElecName] = useState("");
  const [newElecAllocatedVotes, setNewElecAllocatedVotes] = useState(null);
  const [newElecAllocatedFunds, setNewElecAllocatedFunds] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form] = Form.useForm();

  const route_history = useHistory();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  function viewElection(record) {
    route_history.push("/voting/" + record.key);
  }

  const columns = [
    {
      title: "Created",
      dataIndex: "created_date",
      key: "created_date",
      width: 150,
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      align: "center",
      render: name => (
        <Typography.Title level={5}>{name}</Typography.Title>
      ),
    },
    {
      title: "Admin",
      dataIndex: "admin",
      key: "admin",
      width: 250,
      align: "center",
      render: admin => (
        <Address address={admin} fontSize="14pt" ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
      ),
    },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      align: "center",
      render: roles =>
        roles.map(r => {
          let color = "geekblue";
          if (r == "candidate") {
            color = "green";
          }
          return (
            <Tag color={color} key={r}>
              {r.toLowerCase()}
            </Tag>
          );
        }),
    },
    {
      title: "Candidates",
      dataIndex: "n_workers",
      key: "n_workers",
      align: "center",
    },
    {
      title: "Voted",
      dataIndex: "n_voted",
      key: "n_voted",
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
          </Space>
        </>
      ),
    },
  ];
  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("readContracts");
        init();
      }
    }
  }, [readContracts]);

  const init = async () => {
    console.log("contract loaded ", address);
    //listen to events
    let contractName = "Diplomacy";
    addEventListener(contractName, "ElectionCreated", onElectionCreated);
    addEventListener(contractName, "BallotCast", onBallotCast);
    updateView();
  };

  const addEventListener = async (contractName, eventName, callback) => {
    await readContracts[contractName].removeListener(eventName);
    readContracts[contractName].on(eventName, (...args) => {
      let eventBlockNum = args[args.length - 1].blockNumber;
      if (eventBlockNum >= localProvider._lastBlockNumber) {
        callback();
      }
    });
  };

  function onElectionCreated() {
    console.log("onElectionCreated");
    setIsCreating(false);
    form.resetFields();
    if (slider && slider.current) {
      slider.current.goTo(0);
    }
    updateView();
  }

  function onBallotCast() {
    console.log("onBallotCast");
    updateView();
  }

  const updateView = async () => {
    console.log("updateView ");
    setTableDataLoading(true);
    const numElections = (await readContracts.Diplomacy.numElections()).toNumber();
    // console.log("numElections ", numElections);
    setNumElections(numElections);
    let data = [];
    let elections = [];
    for (let i = 0; i < numElections; i++) {
      const election = await readContracts.Diplomacy.getElectionById(i);
      //   console.log("election ", election);
      const name = election.name;
      const n_addr = election.n_addr.toNumber();
      const n_voted = (await readContracts.Diplomacy.getElectionVoted(i)).toNumber();

      let status = "Active";
      if (!election.isActive) {
        status = "Inactive";
      }
      let created_date = new Date(election.createdAt.toNumber() * 1000);
      created_date = created_date.toISOString().substring(0, 10);
      let admin = election.admin;
      let roles = [];
      const isAdmin = election.admin == address;
      if (isAdmin) {
        roles.push("admin");
      }
      const isCandidate = await readContracts.Diplomacy.canVote(i, address);
      if (isCandidate) {
        roles.push("candidate");
      }
      data.push({
        key: i,
        created_date: created_date,
        name: name,
        n_workers: n_addr,
        n_voted: n_voted,
        admin: admin,
        roles: roles,
        status: status,
      });
    }
    data = data.reverse();
    setTableDataSrc(data);
    setTableDataLoading(false);
  };

  const createNewElection = () => {
    console.log("createNewElection");
    setIsModalVisible(true);
  };

  const onFinish = async () => {
    setIsCreating(true);
    console.log({ newElecAllocatedFunds });
    console.log({ newElecAllocatedVotes });
    console.log({ newElecName });
    console.log({ addresses });
    console.log({ tokenAdr });
    // Create a new election
    const result = tx(
      writeContracts.Diplomacy.newElection(
        newElecName, 
        newElecAllocatedFunds, 
        // fundsType, 
        tokenAdr,
        newElecAllocatedVotes, 
        addresses
      ),
      update => {
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
        } else {
          console.log("update error ", update.status);
          setIsCreating(false);
        }
      },
    );
  };


  const approveToken = async () => {
    // NOTE: Using UNI token for testnet!
    const tokenAddress = writeContracts["UNI"].address;
    const userAddress = await userSigner.getAddress();
    const tokenContract = writeContracts["UNI"].connect(userSigner);
    const res = tx(
      tokenContract.approve(
        writeContracts.Diplomacy.address,
        newElecAllocatedFunds,
      ),
      update => {
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
        } else {
          console.log("update error ", update.status);
          setIsCreating(false);
        }
      },
    )
  }

  const slider = useRef(null);

  const [addresses, setAddresses] = useState([]);
  const [toAddress, setToAddress] = useState("");

  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [fundsType, setFundsType] = useState("ETH");
  const [tokenAdr, setTokenAdr] = useState("0x0000000000000000000000000000000000000000");

  let table_state = {
    bordered: true,
    loading: tableDataLoading,
  };

  const selectFundsType = (
    <Select defaultValue="ETH"
      className="select-funds-type" 
      onChange={ value => { 
        setFundsType(value); 
        if ( value == "ETH" ) {
          setTokenAdr("0x0000000000000000000000000000000000000000");
        } else if (value == "GTC") {
          // UNISWAP TOKEN ADDRESS FOR TESTING! 
          const adr = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
          setTokenAdr(adr);
        }
      } }>
      <Option value="ETH">ETH</Option>
      <Option value="GTC">GTC</Option>
    </Select>
  );

  return (
    <>
      <Modal visible={isModalVisible} footer={false} onCancel={handleCancel} style={{width: "400px"}}>
        <Form
          layout="vertical"
          form={form}
          name="basic"
          // labelCol={{ span: 6 }}
          // wrapperCol={{ span: 16 }}
          initialValues={{ remember: false }}
          onFinish={onFinish}
        >
          <Carousel ref={slider} afterChange={() => {}} speed="300" dots={false}>
            <div>
              <PageHeader
                ghost={false}
                title="Create A New Election"
                // subTitle="Election Options"
                // style={{
                //   display: "flex",
                //   justifyContent: "center",
                //   alignItems: "center",
                // }}
              />
              <Form.Item
                name="elec_name"
                label="Election Name"
                rules={[{ required: true, message: "Please input election name!" }]}
              >
                <Input
                  size="large"
                  placeholder="Enter Name"
                  autoComplete="false"
                  allowClear={true}
                  style={{
                    width: 300,
                  }}
                  onChange={e => {
                    e.target.value ? setNewElecName(e.target.value) : null;
                  }}
                />
              </Form.Item>
              <Form.Item
                name="funds"
                label="Funding Allocation"
                rules={[{ required: true, pattern: new RegExp(/^[.0-9]+$/), message: "Funding is Required!" }]}
              >
              <Input 
                addonAfter={selectFundsType} 
                placeholder="Enter Amount"
                size="large"
                allowClear={true}
                value={newElecAllocatedFunds}
                style={{
                    width: 300,
                }}
                onChange={e => {
                  if (!isNaN(Number(e.target.value))) {
                    let funds; 
                    if (fundsType === "ETH") {
                      funds = toWei(Number(e.target.value).toFixed(18).toString());
                    } else if (fundsType === "GTC") {
                      funds = toWei(Number(e.target.value).toFixed(18).toString()); //*10^18 for Tokens?? -> toWei does this, but hacky
                    }
                    setNewElecAllocatedFunds(funds);
                  }
                }}
              />
              </Form.Item>
              <Form.Item
                name="votes"
                label="Vote Allocation"
                rules={[
                  { required: true, message: "Please input number of votes!" },
                  { pattern: new RegExp(/^[0-9]+$/), message: "Invalid Vote Allocation!" },
                ]}
              >
                <InputNumber
                  size="large"
                  placeholder="1"
                  style={{
                    width: 300,
                  }}
                  min="1"
                  onChange={value => {
                    setNewElecAllocatedVotes(value);
                  }}
                />
              </Form.Item>

              <div
                // style={{
                //   display: "flex",
                //   justifyContent: "center",
                //   alignItems: "center",
                // }}
              >
                <Divider>
                  <Button
                    type="primary"
                    size="large"
                    shape="round"
                    onClick={() => {
                      slider.current.next();
                    }}
                  >
                    Continue
                  </Button>
                </Divider>
              </div>
            </div>

            <div>
              <PageHeader
                ghost={false}
                onBack={() => {
                  slider.current.prev();
                }}
                title="Add Election Candidates"
                // subTitle="Add Election Candidates"
              />
              <Form.Item
                name="candidates"
                // style={{
                //   display: "flex",
                //   justifyContent: "left",
                //   alignItems: "center",
                // }}
              >
                <Space>
                  <AddressInput
                    ensProvider={mainnetProvider}
                    placeholder="Enter address"
                    value={toAddress}
                    onChange={setToAddress}
                  />
                  <Button
                    type="default"
                    size="large"
                    onClick={() => {
                      addresses.push(toAddress);
                      setToAddress("");
                    }}
                  >
                    + Add
                  </Button>
                </Space>
              </Form.Item>
              <List
                style={{ overflow: "auto", height: "200px" }}
                itemLayout="horizontal"
                bordered
                dataSource={addresses}
                renderItem={(item, index) => (
                  <List.Item>
                    <Address address={item} ensProvider={mainnetProvider} fontSize="14pt" />
                    <Button
                      type="link"
                      onClick={async () => {
                        const updatedAddresses = [...addresses];
                        updatedAddresses.splice(index, 1);
                        setAddresses(updatedAddresses);
                      }}
                      size="medium"
                      style={{ marginLeft: "200px" }}
                    >
                      ❌
                    </Button>
                  </List.Item>
                )}
              />
              <div
                // style={{
                //   display: "flex",
                //   justifyContent: "center",
                //   alignItems: "center",
                // }}
              >
                <Divider>
                  <Button
                    type="primary"
                    size="large"
                    shape="round"
                    onClick={() => {
                      slider.current.next();
                    }}
                  >
                    Continue
                  </Button>
                </Divider>
              </div>
            </div>

            <div>
              <PageHeader
                ghost={false}
                onBack={() => {
                  slider.current.prev();
                }}
                title="Confirm Election Details"
                // subTitle="Review Election Details"
              />

              <Descriptions title="Election Details" column={1} size="small" bordered>
                <Descriptions.Item label="Name">{newElecName}</Descriptions.Item>
                <Descriptions.Item label="Allocated Funds">{newElecAllocatedFunds}</Descriptions.Item>
                <Descriptions.Item label="Votes/Candidate">{newElecAllocatedVotes}</Descriptions.Item>
                <Descriptions.Item label="Candidates">
                  <List
                    style={{ overflow: "auto", height: "100px" }}
                    itemLayout="horizontal"
                    bordered
                    dataSource={addresses}
                    renderItem={(adr, index) => (
                  <List.Item>
                      <Address address={adr} ensProvider={mainnetProvider} fontSize="14pt" />  
                      </List.Item>
                    )} />
                  
                </Descriptions.Item>
              </Descriptions>
              <div
                // style={{
                //   display: "flex",
                //   justifyContent: "center",
                //   alignItems: "center",
                // }}
              >
                {fundsType !== "ETH" && (
                  <Divider>
                    <Button type="danger" shape="round" onClick={approveToken}>Approve Token</Button>
                  </Divider>
                )}
                <Divider>
                  {!isCreating && (
                    <Button type="primary" size="large" shape="round" htmlType="submit" className="login-form-button">
                      Confirm Election
                    </Button>
                  )}
                  {isCreating && (
                    <Button type="primary" size="large" shape="round" loading>
                      Creating
                    </Button>
                  )}
                </Divider>
              </div>
            </div>
          </Carousel>
        </Form>
      </Modal>

      <div
        className="elections-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}
      >
        <PageHeader
          ghost={false}
          title="Elections"
          subTitle={`Count: ${numElections}`}
          extra={[
            <Button type="primary" size="large" shape="round" style={{ margin: 4 }} onClick={() => createNewElection()}>
              + Create Election
            </Button>,
          ]}
        />
        <Divider />
        <Table {...table_state} dataSource={tableDataSrc} columns={columns} pagination={{ pageSize: 5 }} />
      </div>
    </>
  );
}
