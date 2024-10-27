// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register the components needed for the chart
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

const Dashboard = () => {
    const [sensorData, setSensorData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const moistureDetectorRef = ref(database, 'sensorModules/moistureDetector'); 
        
        onValue(moistureDetectorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSensorData((prevData) => [
                    ...prevData,
                    {
                        time: new Date().toLocaleTimeString(),
                        humidityLevel: data.humidityLevel,
                        waterDetected: data.waterDetected,
                        waterLevel: data.waterLevel,
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
                label: 'Humidity Level',
                data: sensorData.map((data) => data.humidityLevel),
                borderColor: 'rgba(75,192,192,1)',
                fill: false,
            },
            {
                label: 'Water Level',
                data: sensorData.map((data) => data.waterLevel),
                borderColor: 'rgba(255,99,132,1)',
                fill: false,
            },
            {
                label: 'Water Detected',
                data: sensorData.map((data) => data.waterDetected),
                borderColor: 'rgba(54,162,235,1)',
                fill: false,
            },
        ],
    };

    return (
        <div>
            <h2>Sensor Data</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <Line data = {chartData} />
            )}
        </div>
    );
};

export default Dashboard;
