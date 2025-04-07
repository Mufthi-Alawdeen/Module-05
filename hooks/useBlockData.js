// hooks/useBlockData.js
import { useEffect, useState } from "react";
import { provider } from "../lib/eth";
import { ethers } from "ethers";

export function useBlockData(tokenAddress, tokenABI) {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const fetchBlockData = async (blockNumber) => {
      const block = await provider.getBlockWithTransactions(blockNumber);

      const gasUsed = block.gasUsed.toNumber();
      const gasLimit = block.gasLimit.toNumber();
      const baseFee = block.baseFeePerGas
        ? parseFloat(ethers.formatUnits(block.baseFeePerGas, "gwei"))
        : 0;

      // Fetch ERC20 transfers
      const iface = new ethers.Interface(tokenABI);
      let volume = 0;

      block.transactions.forEach((tx) => {
        try {
          const decoded = iface.parseTransaction({
            data: tx.data,
            value: tx.value,
          });
          if (decoded.name === "transfer") {
            volume += parseFloat(ethers.formatUnits(decoded.args[1], 18));
          }
        } catch {}
      });

      return {
        blockNumber,
        baseFee,
        volume,
        gasRatio: ((gasUsed / gasLimit) * 100).toFixed(2),
      };
    };

    const handleNewBlock = async (blockNumber) => {
      const data = await fetchBlockData(blockNumber);
      setBlocks((prev) => {
        const newData = [data, ...prev];
        return newData.slice(0, 10); // keep only latest 10
      });
    };

    provider.on("block", handleNewBlock);

    // initial load of last 10 blocks
    const init = async () => {
      const latest = await provider.getBlockNumber();
      const blockPromises = Array.from({ length: 10 }, (_, i) =>
        fetchBlockData(latest - i)
      );
      const allBlocks = await Promise.all(blockPromises);
      setBlocks(allBlocks.reverse());
    };

    init();

    return () => provider.off("block", handleNewBlock);
  }, [tokenAddress]);

  return blocks;
}
