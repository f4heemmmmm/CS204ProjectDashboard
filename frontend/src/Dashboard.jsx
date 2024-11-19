import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./index.css"; // Ensure to import CSS

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState([]); // Stores active warnings

  useEffect(() => {
    // WebSocket connection for hygrometer and flow rate data
    const ws = new WebSocket("ws://localhost:3000"); // Adjust your server URL

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    ws.onmessage = (message) => {
      const parsedData = JSON.parse(message.data);
      console.log("Received data:", parsedData);
    
      const hygrometerData = parsedData.hygrometer ?? 0;
      const flowRateData = parsedData.flowRate ?? 0;
    
      // Create a new data point with timestamp
      const newDataPoint = {
        time: new Date(),
        waterDetected: hygrometerData,
        waterLevel: flowRateData,
      };
    
      // Update sensorData state, keeping the last 8 seconds of data
      setSensorData((prevData) => {
        const filteredData = prevData.filter((data) => {
          const timeDifference = newDataPoint.time - new Date(data.time);
          return timeDifference <= 8000; // Keep only the last 8 seconds
        });
    
        return [...filteredData, newDataPoint];
      });
    
      // Update warnings with only one warning per type, but don't remove them when data goes to 0
      setWarnings((prevWarnings) => {
        const newWarnings = [...prevWarnings]; // Clone existing warnings
    
        // Check if a flow rate warning exists, and update it
        const flowRateWarningIndex = newWarnings.findIndex(warning =>
          warning.type === "flowRate"
        );
        if (flowRateData > 0) {
          const newFlowRateWarning = {
            type: "flowRate",
            message: `CHANGE IN WATER LEVEL DETECTED: ${flowRateData} cm³/s at ${newDataPoint.time.toLocaleTimeString()}`,
            timestamp: newDataPoint.time,
          };
          if (flowRateWarningIndex !== -1) {
            // Replace existing flow rate warning
            newWarnings[flowRateWarningIndex] = newFlowRateWarning;
          } else {
            // Add new flow rate warning
            newWarnings.push(newFlowRateWarning);
          }
        }
    
        // Check if a hygrometer warning exists, and update it
        const hygrometerWarningIndex = newWarnings.findIndex(warning =>
          warning.type === "hygrometer"
        );
        if (hygrometerData > 0) {
          const newHygrometerWarning = {
            type: "hygrometer",
            message: `WATER DETECTED: ${hygrometerData}% at ${newDataPoint.time.toLocaleTimeString()}`,
            timestamp: newDataPoint.time,
          };
          if (hygrometerWarningIndex !== -1) {
            // Replace existing hygrometer warning
            newWarnings[hygrometerWarningIndex] = newHygrometerWarning;
          } else {
            // Add new hygrometer warning
            newWarnings.push(newHygrometerWarning);
          }
        }
    
        return newWarnings;
      });
    
      // Set loading to false after data is processed
      setLoading(false);
    };    

    return () => {
      ws.close();
    };
  }, []);

  const chartData = {
    labels: sensorData.map((data) => data.time.toLocaleTimeString()),
    datasets: [
      {
        label: "Change in Water Level",
        data: sensorData.map((data) => data.waterLevel),
        borderColor: "rgba(75,192,192,1)",
        fill: false,
      },
    ],
  };

  const chartData2 = {
    labels: sensorData.map((data) => data.time.toLocaleTimeString()),
    datasets: [
      {
        label: "Water Detected",
        data: sensorData.map((data) => data.waterDetected),
        borderColor: "rgba(54,162,235,1)",
        fill: false,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Leakage Detection System</h1>
      </header>
      <div className="content">
        <div className="left-panel">
          <div className="warnings-section">
            <h2>Warnings</h2>
            <div className="warnings-list">
              {warnings.length > 0 ? (
                warnings.map((warning, index) => (
                  <div key={index} className="limit-item">
                    <p>{warning.message}</p>
                  </div>
                ))
              ) : (
                <p>No warnings at this time.</p>
              )}
            </div>
          </div>
        </div>
        <div className="right-panel">
          <div className="chart-container">
            <h2>Change in Water Level Chart</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Line data={chartData} options={{ maintainAspectRatio: false }} />
            )}
          </div>
          <div className="chart-container">
            <h2>Water Detected Chart</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Line data={chartData2} options={{ maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;