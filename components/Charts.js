// components/Charts.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register all required chart components here
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export function Charts({ blocks }) {
  const blockLabels = blocks.map((b) => b.blockNumber);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Transfer Volume */}
      <Line
        data={{
          labels: blockLabels,
          datasets: [
            {
              label: "ERC20 Transfer Volume",
              data: blocks.map((b) => b.volume),
              borderColor: "blue",
              fill: false,
            },
          ],
        }}
      />

      {/* BASEFEE */}
      <Line
        data={{
          labels: blockLabels,
          datasets: [
            {
              label: "BASEFEE (Gwei)",
              data: blocks.map((b) => b.baseFee),
              borderColor: "green",
              fill: false,
            },
          ],
        }}
      />

      {/* Gas Ratio */}
      <Line
        data={{
          labels: blockLabels,
          datasets: [
            {
              label: "Gas Used / Gas Limit (%)",
              data: blocks.map((b) => b.gasRatio),
              borderColor: "orange",
              fill: false,
            },
          ],
        }}
      />
    </div>
  );
}
