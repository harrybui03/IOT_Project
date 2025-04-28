import {useState} from "react";
import './LeftPanel.css'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:5000/api';
enum Mode {
    Suction,
    Injection,
}

export  function LeftPanel() {
    const [suctionRadius, setSuctionRadius] = useState('');
    const [suctionCapacity, setSuctionCapacity] = useState('');
    const [suctionRate, setSuctionRate] = useState('');
    const [injectionRadius, setInjectionRadius] = useState('');
    const [injectionCapacity, setInjectionCapacity] = useState('');
    const [injectionRate, setInjectionRate] = useState('');
    const [mode, setMode] = useState(Mode.Suction);
    const [displacement, setDisplacement] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateNumber = (value: string): boolean => {
        return !isNaN(Number(value)) && Number(value) >= 0;
    };

    const handleStart = async () => {
        setLoading(true);
        setError(null);
        console.log('Start button clicked in', mode === Mode.Suction ? 'Suction' : 'Injection', 'mode');
        let command = '';
        let isValid = true;
        if (mode === Mode.Suction) {
            if (!validateNumber(suctionRadius) || !validateNumber(suctionCapacity) || !validateNumber(suctionRate)) {
                toast.error('Vui lòng nhập giá trị không âm cho bán kính, dung tích và lưu lượng.');
                isValid = false;
            } else {
                command = `START_SUCTION radius:${suctionRadius} capacity:${suctionCapacity} rate:${suctionRate}`;
                console.log('Sending suction command:', command);
            }
        } else {
            if (!validateNumber(injectionRadius) || !validateNumber(injectionCapacity) || !validateNumber(injectionRate)) {
                toast.error('Vui lòng nhập giá trị không âm cho bán kính, dung tích và lưu lượng.');
                isValid = false;
            } else {
                command = `START_INJECTION radius:${injectionRadius} capacity:${injectionCapacity} rate:${injectionRate}`;
                console.log('Sending injection command:', command);
            }
        }

        if (isValid) {
            try {
                const response = await axios.post(`${API_URL}/send-data`, { data: command });
                console.log(response.data.message); // Log the response from the server
                toast.success(response.data.message || 'Đã gửi lệnh bắt đầu.');
            } catch (err: any) {
                toast.error(err.message || 'Không thể bắt đầu thao tác.');
                console.error('Error starting:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        setError(null);
        console.log('Stop button clicked in', mode === Mode.Suction ? 'Suction' : 'Injection', 'mode');
        try {
            const response = await axios.post(`${API_URL}/stop-signal`);
            console.log(response.data.message);
            toast.success(response.data.message || 'Đã gửi lệnh dừng.');
        } catch (err: any) {
            toast.error(err.message || 'Không thể dừng thao tác.');
            console.error('Error stopping:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisplace = async () => {
        setLoading(true);
        setError(null);
        if (!validateNumber(displacement)) {
            toast.error('Vui lòng nhập giá trị dịch chuyển không âm.');
            setLoading(false);
            return;
        }
        console.log('Displace button clicked with value:', displacement, 'mm');
        try {
            const response = await axios.post(`${API_URL}/movement`, { mm: displacement });
            console.log(response.data.message);
            toast.success(response.data.message || 'Đã gửi lệnh dịch chuyển.');
        } catch (err: any) {
            toast.error(err.message || 'Không thể dịch chuyển.');
            console.error('Error displacing:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToZero = async () => {
        setLoading(true);
        setError(null);
        console.log('Go to 0 button clicked');
        try {
            const response = await axios.post(`${API_URL}/movement`, { mm: 0 });
            console.log(response.data.message);
            toast.success(response.data.message || 'Đã gửi lệnh về điểm 0.');
            setDisplacement('');
        } catch (err: any) {
            toast.error(err.message || 'Không thể về điểm 0.');
            console.error('Error going to zero:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setValue: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setValue(value);
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
                        Chế độ tiêm
                    </button>
                </div>
                {/* {error && <div className="error-message">{error}</div>} */} {/* Remove default error display */}

                <form className="input-form">
                    {mode === Mode.Suction && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Bán kính:</label>
                                <input
                                    type="number"
                                    value={suctionRadius}
                                    onChange={(e) => handleInputChange(setSuctionRadius, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">cm</span>
                            </div>
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
                                <label className="form-label">Lưu lượng dòng chảy:</label>
                                <input
                                    type="number"
                                    value={suctionRate}
                                    onChange={(e) => handleInputChange(setSuctionRate, e.target.value)}
                                    className="form-input form-select"
                                />
                                <span className="unit">mL/s</span>
                            </div>
                        </>
                    )}

                    {mode === Mode.Injection && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Bán kính:</label>
                                <input
                                    type="number"
                                    value={injectionRadius}
                                    onChange={(e) => handleInputChange(setInjectionRadius, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">cm</span>
                            </div>
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
                                <label className="form-label">Lưu lượng dòng chảy:</label>
                                <input
                                    type="number"
                                    value={injectionRate}
                                    onChange={(e) => handleInputChange(setInjectionRate, e.target.value)}
                                    className="form-input"
                                />
                                <span className="unit">mL/s</span>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={handleStart} className="form-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Bắt đầu'}
                        </button>
                        <button type="button" onClick={handleStop} className="stop-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Dừng'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="movement-panel">
                <form className="movement-form">
                    <div className="form-group">
                        <label className="form-label">Dịch Chuyển:</label>
                        <input
                            type="number"
                            value={displacement}
                            onChange={(e) => handleInputChange(setDisplacement, e.target.value)}
                            className="form-input"
                        />
                        <span className="unit">mm</span>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={handleDisplace} className="form-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Dịch chuyển'}
                        </button>
                        <button type="button" onClick={handleGoToZero} className="reset-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Về điểm 0'}
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}