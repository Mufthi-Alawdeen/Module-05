"use client";
import { useEffect, useState } from "react";
import provider from "../../lib/eth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ethers, utils } from "ethers";

// ERC20 Token setup (USDC)
const tokenABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const getInitialData = async () => {
      const latest = await provider.getBlockNumber();
      const blockInfo = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const blockNumber = latest - i;

          const [block, logs] = await Promise.all([
            provider.getBlock(blockNumber),
            provider.getLogs({
              address: tokenAddress,
              fromBlock: blockNumber,
              toBlock: blockNumber,
              topics: [utils.id("Transfer(address,address,uint256)")],
            }),
          ]);

          let totalVolume = 0;
          for (let log of logs) {
            const parsed = tokenContract.interface.parseLog(log);
            totalVolume += parseFloat(utils.formatUnits(parsed.args.value, 6)); // USDC = 6 decimals
          }

          return {
            blockNumber: block.number,
            baseFee: block.baseFeePerGas
              ? parseFloat(utils.formatUnits(block.baseFeePerGas, "gwei"))
              : 0,
            gasRatio:
              block.gasUsed && block.gasLimit
                ? (block.gasUsed.toNumber() / block.gasLimit.toNumber()) * 100
                : 0,
            tokenVolume: totalVolume,
          };
        })
      );
      setData(blockInfo.reverse());
    };

    const subscribe = () => {
      provider.on("block", async (blockNumber: number) => {
        const [block, logs] = await Promise.all([
          provider.getBlock(blockNumber),
          provider.getLogs({
            address: tokenAddress,
            fromBlock: blockNumber,
            toBlock: blockNumber,
            topics: [utils.id("Transfer(address,address,uint256)")],
          }),
        ]);

        let totalVolume = 0;
        for (let log of logs) {
          const parsed = tokenContract.interface.parseLog(log);
          totalVolume += parseFloat(utils.formatUnits(parsed.args.value, 6));
        }

        setData((prev) => [
          ...prev.slice(1),
          {
            blockNumber: block.number,
            baseFee: block.baseFeePerGas
              ? parseFloat(utils.formatUnits(block.baseFeePerGas, "gwei"))
              : 0,
            gasRatio:
              block.gasUsed && block.gasLimit
                ? (block.gasUsed.toNumber() / block.gasLimit.toNumber()) * 100
                : 0,
            tokenVolume: totalVolume,
          },
        ]);
      });
    };

    getInitialData();
    subscribe();

    return () => {
      provider.removeAllListeners();
    };
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "2rem" }}
      >
        Ethereum Realtime Dashboard
      </h1>

      {/* Chart 1: ERC20 Token Transfer Volume */}
      <h2 style={{ marginBottom: "0.5rem" }}>
        🟠 ERC20 Transfer Volume (USDC)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="blockNumber" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="tokenVolume"
            stroke="#FF8042"
            name="USDC Volume"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart 2: Base Fee */}
      <h2 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
        🔵 Base Fee (Gwei)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="blockNumber" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="baseFee"
            stroke="#8884d8"
            name="Base Fee (Gwei)"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart 3: Gas Usage Ratio */}
      <h2 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
        🟢 Gas Used / Gas Limit (%)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="blockNumber" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="gasRatio"
            stroke="#82ca9d"
            name="Gas Usage %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
