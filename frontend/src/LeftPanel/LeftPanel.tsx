import { useState } from "react";
import './LeftPanel.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3000/api';

enum Mode {
    Suction,
    Injection,
}

interface DataPayload {
    mode: 'hut' | 'day';
    time: number;
    ml: number;
}

export function LeftPanel() {
    const [suctionCapacity, setSuctionCapacity] = useState('');
    const [suctionRate, setSuctionRate] = useState('');
    const [injectionCapacity, setInjectionCapacity] = useState('');
    const [injectionRate, setInjectionRate] = useState('');
    const [mode, setMode] = useState(Mode.Suction);
    const [loading, setLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // New state to track pause/resume

    const handleStart = async () => {
        setLoading(true);
        setIsPaused(false); // Reset to running state on start
        let isValid = true;
        let payload: DataPayload | null = null;
        let mlValue: number | null = null;
        let timeValue: number | null = null;

        if (mode === Mode.Suction) {
            if (!validateNumber(suctionCapacity) || !validateNumber(suctionRate)) {
                toast.error('Vui lòng nhập đúng định dạng số cho dung tích và thời gian hút.');
                isValid = false;
            } else {
                mlValue = roundToOneDecimal(parseFloat(suctionCapacity));
                timeValue = parseFloat(suctionRate);

                if (mlValue > 25) {
                    toast.error('Dung tích hút không được lớn hơn 25 mL.');
                    isValid = false;
                } else if (timeValue < mlValue) {
                    toast.error('Thời gian hút phải lớn hơn hoặc bằng dung tích hút.');
                    isValid = false;
                }

                if (isValid) {
                    payload = {
                        mode: 'hut',
                        time: timeValue,
                        ml: mlValue,
                    };
                }
            }
        } else if (mode === Mode.Injection) {
            if (!validateNumber(injectionCapacity) || !validateNumber(injectionRate)) {
                toast.error('Vui lòng nhập đúng định dạng số cho dung tích và thời gian đẩy.');
                isValid = false;
            } else {
                mlValue = roundToOneDecimal(parseFloat(injectionCapacity));
                timeValue = parseFloat(injectionRate);

                if (mlValue > 25) {
                    toast.error('Dung tích đẩy không được lớn hơn 25 mL.');
                    isValid = false;
                } else if (timeValue < mlValue) {
                    toast.error('Thời gian đẩy phải lớn hơn hoặc bằng dung tích đẩy.');
                    isValid = false;
                }

                if (isValid) {
                    payload = {
                        mode: 'day',
                        time: timeValue,
                        ml: mlValue,
                    };
                }
            }
        }

        if (isValid && payload) {
            try {
                const response = await axios.post(`${API_URL}/send-data`, payload);
                toast.success(response.data.message || `Đã gửi lệnh ${mode === Mode.Suction ? 'hút' : 'đẩy'}.`);
            } catch (err: any) {
                toast.error(err.message || `Không thể bắt đầu thao tác ${mode === Mode.Suction ? 'hút' : 'đẩy'}.`);
                console.error('Error starting:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    const handlePauseResume = async () => {
        setLoading(true);
        const action = isPaused ? 'resume' : 'pause';
        console.log(`${action} button clicked in`, mode === Mode.Suction ? 'Suction' : 'Injection', 'mode');
        try {
            const response = await axios.post(`${API_URL}/stop-resume`, { action });
            console.log(response.data.message);
            toast.success(response.data.message || `Đã gửi lệnh ${action === 'pause' ? 'dừng' : 'tiếp tục'}.`);
            setIsPaused(!isPaused); // Toggle pause state
        } catch (err: any) {
            toast.error(err.message || `Không thể ${action === 'pause' ? 'dừng' : 'tiếp tục'} thao tác.`);
            console.error(`Error ${action}ing:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setValue: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setValue(value);
    };

    const validateNumber = (value: string): boolean => {
        return !isNaN(Number(value)) && Number(value) >= 0;
    };

    const roundToOneDecimal = (num: number): number => {
        return Math.round(num * 10) / 10;
    };

    return (
        <div className="app-container">
            <div className="control-panel">
                <div className="mode-tabs">
                    <button
                        className={`mode-tab ${mode === Mode.Suction ? 'active' : ''}`}
                        onClick={() => setMode(Mode.Suction)}
                    >
                        Chế độ hút
                    </button>
                    <button
                        className={`mode-tab ${mode === Mode.Injection ? 'active' : ''}`}
                        onClick={() => setMode(Mode.Injection)}
                    >
                        Chế độ đẩy
                    </button>
                </div>

                <form className="input-form">
                    {mode === Mode.Suction && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Dung tích:</label>
                                <input
                                    type="number"
                                    value={suctionCapacity}
                                    onChange={(e) => handleInputChange(setSuctionCapacity, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">mL</span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thời Gian:</label>
                                <input
                                    type="number"
                                    value={suctionRate}
                                    onChange={(e) => handleInputChange(setSuctionRate, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">sec</span>
                            </div>
                        </>
                    )}

                    {mode === Mode.Injection && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Dung tích:</label>
                                <input
                                    type="number"
                                    value={injectionCapacity}
                                    onChange={(e) => handleInputChange(setInjectionCapacity, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">mL</span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thời Gian:</label>
                                <input
                                    type="number"
                                    value={injectionRate}
                                    onChange={(e) => handleInputChange(setInjectionRate, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">sec</span>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={handleStart} className="form-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Bắt đầu'}
                        </button>
                        <button
                            type="button"
                            onClick={handlePauseResume}
                            className="stop-button"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : isPaused ? 'Tiếp tục' : 'Dừng'}
                        </button>
                    </div>
                </form>
            </div>

            <ToastContainer />
        </div>
    );
}