import React, { useState, useRef, ReactNode } from 'react';
import GuacaPlayer from './GuacaPlayer'
import './index.less'

const App: React.FC = () => {
    const [inputValue, setInputValue] = useState("");
    const [src, setSrc] = useState("https://127.0.0.1:8443/sessions/96406f0d-f70a-4120-8288-9088138cad5f");
    const [player, setPlayer] = useState<any>(null)

    function getPlayer(player?: any) {
        if(player) {
            setPlayer(player);
        }
    }
    return (
        <div className={"app"}>
            <div className={"input"}>
                <input defaultValue={src} onChange={(e)=>{
                    setInputValue(e.target.value)
                }}/>
                <button onClick={()=>{
                    setSrc(inputValue)
                }}>加载</button>
            </div>
            <div className={"app-player-wrapper"}>
                <div>
                    <GuacaPlayer src={src} width={600} getPlayer={getPlayer}/>

                </div>
                <ul>
                    <li onClick={()=>{
                        player && player.seek({inputValue: 235774})
                    }}>235774</li>
                    <li onClick={()=>{
                        player && player.seek({inputValue: 135774})
                    }}>135774</li>
                    <li onClick={()=>{
                        player && player.seek({inputValue: 535774})
                    }}>535774</li>
                </ul>
            </div>
        </div>
    )
}


export default App