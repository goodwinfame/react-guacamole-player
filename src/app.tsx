import React, { useState, useRef, ReactNode, useEffect } from 'react';
import GuacaPlayer from './GuacaPlayer'

const App: React.FC = () => {
    const [inputValue, setInputValue] = useState("");
    const [src, setSrc] = useState("https://127.0.0.1:3000/console/audit/recording/5526774f-62aa-4968-9813-ccc1e305a8ed.mp4");
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
                <GuacaPlayer src={src}/>

               
            </div>
        </div>
    )
}


export default App