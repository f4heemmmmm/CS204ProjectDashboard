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
import "./index.css"; // Make sure to import CSS

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

  const [waterLevelLimit, setWaterLevelLimit] = useState(0.0);
  const [waterDetectedLimit, setWaterDetectedLimit] = useState(0.0);
  const [isEditingWaterLevel, setIsEditingWaterLevel] = useState(false);
  const [isEditingWaterDetected, setIsEditingWaterDetected] = useState(false);

  useEffect(() => {
    // WebSocket connection for hygrometer and flow rate data
    const ws = new WebSocket("ws://localhost:3000"); // Adjust your server URL

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (message) => {
      const parsedData = JSON.parse(message.data);
      console.log("Received data:", parsedData);

      // Check if parsedData has the necessary structure for hygrometer and flowRate
      if (parsedData.hygrometer && parsedData.flowRate) {
        const hygrometerData = parsedData.hygrometer;
        const flowRateData = parsedData.flowRate;

        // Create new data point
        const newDataPoint = {
          time: new Date(),
          waterDetected: hygrometerData, // Hygrometer (moisture) under waterDetected
          waterLevel: flowRateData,      // Flow rate under waterLevel
        };

        // Update sensorData state, keeping only the last 15 seconds of data
        setSensorData((prevData) => {
          // Filter out data older than 8 seconds
          const filteredData = prevData.filter((data) => {
            const timeDifference = newDataPoint.time - new Date(data.time);
            return timeDifference <= 8000; // 8 seconds
          });

          // Append the new data point and return updated state
          return [...filteredData, newDataPoint];
        });

        setLoading(false);
      }
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

  const handleWaterLevelEdit = () => setIsEditingWaterLevel(true);
  const handleWaterDetectedEdit = () => setIsEditingWaterDetected(true);

  const handleWaterLevelChange = (e) => setWaterLevelLimit(e.target.value);
  const handleWaterDetectedChange = (e) => setWaterDetectedLimit(e.target.value);

  const handleWaterLevelSave = () => setIsEditingWaterLevel(false);
  const handleWaterDetectedSave = () => setIsEditingWaterDetected(false);

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Leakage Detection System</h1>
      </header>
      <div className="content">
        <div className="left-panel">
          <div className="limits-section">
            <h2>Limits</h2>
            <div className="limit-item">
              <div className="limit-label">Change in Water Level</div>
              {isEditingWaterLevel ? (
                <input
                  type="number"
                  value={waterLevelLimit}
                  onChange={handleWaterLevelChange}
                />
              ) : (
                <div className="limit-value">{waterLevelLimit} cm³/s</div>
              )}
              {isEditingWaterLevel ? (
                <button onClick={handleWaterLevelSave}>Save</button>
              ) : (
                <button className="edit-button" onClick={handleWaterLevelEdit}>
                  Edit
                </button>
              )}
            </div>
            <div className="limit-item">
              <div className="limit-label">Water Detected</div>
              {isEditingWaterDetected ? (
                <input
                  type="number"
                  value={waterDetectedLimit}
                  onChange={handleWaterDetectedChange}
                />
              ) : (
                <div className="limit-value">{waterDetectedLimit} cm³</div>
              )}
              {isEditingWaterDetected ? (
                <button onClick={handleWaterDetectedSave}>Save</button>
              ) : (
                <button className="edit-button" onClick={handleWaterDetectedEdit}>
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className="warnings-section">
            <h2>Warnings</h2>
            <div className="warnings-list">
              {sensorData.length > 0 && (
                <>
                  {sensorData[sensorData.length - 1].waterLevel > waterLevelLimit && (
                    <div className="limit-item">
                      <p>
                        CHANGE IN WATER LEVEL LIMIT REACHED: Current Change in
                        Water Level at {sensorData[sensorData.length - 1].waterLevel} cm³/s
                      </p>
                    </div>
                  )}
                  {sensorData[sensorData.length - 1].waterDetected > waterDetectedLimit && (
                    <div className="limit-item">
                      <p>
                        WATER DETECTED LIMIT REACHED: Current Water Detected at{" "}
                        {sensorData[sensorData.length - 1].waterDetected} cm³
                      </p>
                    </div>
                  )}
                </>
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
