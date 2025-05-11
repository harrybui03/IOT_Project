import './App.css';
import {LeftPanel} from "./LeftPanel/LeftPanel.tsx";
import RightPanel from "./RightPanel/RightPanel.tsx";

function App() {

    return (
        <>
            <div className="app-container-panel">
                <div className="container">
                    <h1 className="title">Thiết bị điều khiển kim tiêm</h1>
                    {/*<RightPanel/>*/}
                    <LeftPanel/>
                </div>
            </div>
        </>
    )
}

export default App;