import { PageHeader } from "antd";
import React from "react";
import { ReactComponent as Logo } from "../assets/logo.svg";

// displays a page header

export default function Header() {
  return (
    <div style={{ position: "absolute", top: "1%", left: "2%" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <h4
            style={{
              color: "#ffcc00",
              fontWeight: 300,
              fontSize: "20px",
              lineHeight: "30px",
              marginRight: 10,
              marginBottom: 2,
            }}
          >
            Quadratic Diplomacy
          </h4>
          <Logo />
        </div>

        <h4 className="header-sub">by MOONSHOT COLLECTIVE</h4>
      </div>
    </div>
  );
}
