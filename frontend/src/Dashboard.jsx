import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
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

// Register the components needed for the chart
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

  // State variables for limits
  const [waterLevelLimit, setWaterLevelLimit] = useState(0.0);
  const [waterDetectedLimit, setWaterDetectedLimit] = useState(0.0);
  const [isEditingWaterLevel, setIsEditingWaterLevel] = useState(false);
  const [isEditingWaterDetected, setIsEditingWaterDetected] = useState(false);

  useEffect(() => {
    const moistureDetectorRef = ref(database, "sensorModules/moistureDetector");

    onValue(moistureDetectorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData((prevData) => [
          ...prevData,
          {
            time: new Date().toLocaleTimeString(),
            waterLevel: data.waterLevel,
            waterDetected: data.waterDetected,
          },
        ]);
        setLoading(false);
      }
    });
  }, []);

  const chartData = {
    labels: sensorData.map((data) => data.time),
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
    labels: sensorData.map((data) => data.time),
    datasets: [
      {
        label: "Water Detected",
        data: sensorData.map((data) => data.waterDetected),
        borderColor: "rgba(54,162,235,1)",
        fill: false,
      },
    ],
  };

  // Handlers for editing limits
  const handleWaterLevelEdit = () => {
    setIsEditingWaterLevel(true);
  };

  const handleWaterDetectedEdit = () => {
    setIsEditingWaterDetected(true);
  };

  const handleWaterLevelChange = (e) => {
    setWaterLevelLimit(e.target.value);
  };

  const handleWaterDetectedChange = (e) => {
    setWaterDetectedLimit(e.target.value);
  };

  const handleWaterLevelSave = () => {
    setIsEditingWaterLevel(false);
    // Here you can save the updated limit to your database if needed
  };

  const handleWaterDetectedSave = () => {
    setIsEditingWaterDetected(false);
    // Here you can save the updated limit to your database if needed
  };

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
                <button
                  className="edit-button"
                  onClick={handleWaterDetectedEdit}
                >
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
                  {sensorData[sensorData.length - 1].waterLevel >
                    waterLevelLimit && (
                    <div className="limit-item">
                      <p>
                        CHANGE IN WATER LEVEL LIMIT REACHED: Current Change in
                        Water Level at{" "}
                        {sensorData[sensorData.length - 1].waterLevel} cm³/s
                      </p>
                    </div>
                  )}
                  {sensorData[sensorData.length - 1].waterDetected >
                    waterDetectedLimit && (
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
            <button className="view-all-button">View all</button>
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
              <Line
                data={chartData2}
                options={{ maintainAspectRatio: false }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
