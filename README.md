# react-guacamole-player

[![npm Version](https://img.shields.io/badge/npm-v1.0.1-blue)](https://www.npmjs.org/package/react-guacamole-player)
[![Dependencies](https://img.shields.io/badge/react-^16.8-red)](https://www.npmjs.org/package/react-guacamole-player)

This reusable React component that can play guacamole session recordings uses guacamole-common-js as it's rendering core.


## Requirement
- The player is built based on React Hooks. It requires the React version >= 16.8.
- The server side which provides session recordings needs to support Range-Content header.

## Install
```
yarn add react-guacamole-player
```
or
```
npm i -S react-guacamole-player
```

## Example
```javascript
import React, { useState } from 'react';
import GuacaPlayer from 'react-guacamole-player'


/**
 * src is the session log URL
*/
const App: React.FC = () => {
    const [src, setSrc] = useState("");
    return (
        <div>
            <GuacaPlayer src={src}/>
        </div>
    )
}

```

## Controlled Player Size
```javascript
import React, { useState } from 'react';
import GuacaPlayer from 'react-guacamole-player'

const App: React.FC = () => {
    const [src, setSrc] = useState("");
    return (
        <div>
            <GuacaPlayer src={src} width={500} height={400}/>
        </div>
    )
}

```

## Disable Autoplay
```javascript
import React, { useState } from 'react';
import GuacaPlayer from 'react-guacamole-player'


/**
 * The player will autoplay by default
*/
const App: React.FC = () => {
    const [src, setSrc] = useState("");
    return (
        <div>
            <GuacaPlayer src={src} autoPlay={false}/>
        </div>
    )
}

```


## Outside Control
```javascript
import React, { useState, useCallback } from 'react';
import GuacaPlayer from 'react-guacamole-player'


/**
 * Player is an object contains the following callbacks:
 * 
 * play: Function;
 * pause: Function;
 * seek: (e: {inputValue: number}) => Promise<unknown>;
 * cancelSeek: Function;
 * getDuration: () => Promise<number>;
 * getCurrentDuration: () => Promise<number>;
 * 
*/
const App: React.FC = () => {
    const [src, setSrc] = useState("");
    const [player, setPlayer] = useState<null | Player>(null);

    const jumpTo = useCallback(()=>{
        // inputValue units ms
        player && player.seek({inputValue: 10000})
    }, [player])

    return (
        <div>
            <button onClick={jumpTo}>Go to 00:10</button>
            <GuacaPlayer src={src} getPlayer={(player)=>{
                setPlayer(player)
            }}/>
        </div>
    )
}

```


## Internationalization
```javascript
import React, { useState, useCallback } from 'react';
import GuacaPlayer from 'react-guacamole-player'


/**
 * translate is a callback which returns a translation object.
*/
const App: React.FC = () => {
    const [src, setSrc] = useState("");

    const translate = useCallback((default)=>{
        return {
            ...default,
            "btn.loading": "Your translation...",
        }
    }, [])

    return (
        <div>
            <GuacaPlayer src={src} translate={translate}/>
        </div>
    )
}

```

## Dev the project

```
yarn start
```
or
```
npm start
```

## Build library
```
yarn run build
```
or
```
npm run build
```

## License

MIT
