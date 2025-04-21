import {useEffect, useState} from "react";
import './RightPanel.css'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api';
const RightPanel = () => {
    const [liquidLevel, setLiquidLevel] = useState(100);
    const maxVolume = 350;
    const [loading , setLoading] = useState(true);
    const levelPercentage = (liquidLevel / maxVolume) * 100;

    useEffect(() => {
        const fetchLiquidLevel = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/current-ml`);
                setLiquidLevel(response.data.mL);
            } catch (err){
                console.error('Error fetching liquid level:', err);
                setLiquidLevel(null);
            } finally {
                setLoading(false);
            }
        }

        fetchLiquidLevel();
        const intervalId = setInterval(fetchLiquidLevel , 1000);
        return () => clearInterval(intervalId);
    } , [])
    return (
        <div className="cylinder-container">
            <div className="cylinder">
                {loading ? (
                    <div className="level" style={{ height: `0%` }}>Loading...</div>
                ) : liquidLevel === null ? (
                    <div className="level" style={{ height: `0%` }}>Error</div>
                ) : (
                    <div className="level" style={{ height: `${levelPercentage}%` }}>{liquidLevel} ml</div>
                )}
            </div>
        </div>
    );
}

export default RightPanel;