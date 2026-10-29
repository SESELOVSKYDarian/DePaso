import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Commercial} from './Film';
const Root=()=> <><Composition id="DePaso-Commercial-Dark" component={Commercial} width={1920} height={1080} fps={30} durationInFrames={1056} defaultProps={{bgm:true}}/><Composition id="DePaso-Hook-Preview" component={Commercial} width={1920} height={1080} fps={30} durationInFrames={384} defaultProps={{bgm:true}}/></>;
registerRoot(Root);
