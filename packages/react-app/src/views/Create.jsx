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

  return (
    <>
      <div
        className="create-elections-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}
      >
        <PageHeader
          ghost={false}
          title="Create New Election"
          extra={[
            // <Button type="primary" size="large" shape="round" style={{ margin: 4 }} onClick={() => createNewElection()}>
            //   + Create Election
            // </Button>,
          ]}
        />
        <Divider />
        {/* {electionsMap && <Table dataSource={Array.from(electionsMap.values())} columns={columns} pagination={false}></Table>} */}
      </div>
    </>
  );

}
