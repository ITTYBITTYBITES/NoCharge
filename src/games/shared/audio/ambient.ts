import { loadPref } from '../storage';
import { getSoundVolume, isSoundEnabled, isMuted } from './play';
export type AmbientName='none'|'rainfall'|'cafe'|'white-noise';
let source: AudioBufferSourceNode|null=null; let gain:GainNode|null=null; let active:AmbientName='none';
export function stopAmbient(){ source?.stop(); source?.disconnect(); gain?.disconnect(); source=null;gain=null;active='none'; }
export function getAmbient(){ const v=loadPref<string>('ambient-sound','none'); return ['none','rainfall','cafe','white-noise'].includes(v)?v as AmbientName:'none'; }
export function startAmbient(name=getAmbient()): AmbientName { stopAmbient(); if(name==='none'||isMuted()||!isSoundEnabled()) return 'none'; if(typeof window==='undefined')return 'none'; const C=window.AudioContext||(window as any).webkitAudioContext; if(!C)return 'none'; const c=new C(); const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate); const data=buffer.getChannelData(0); for(let i=0;i<data.length;i++){const white=Math.random()*2-1;data[i]=name==='white-noise'?white*.035:(data[i-1]??0)*.985+white*.01;} source=c.createBufferSource();source.buffer=buffer;source.loop=true;gain=c.createGain();gain.gain.value=getSoundVolume()/100*.035;source.connect(gain);gain.connect(c.destination);source.start();active=name;return name; }
export function getActiveAmbient(){return active;}
export function refreshAmbient(){return startAmbient(getAmbient());}
export function duckAmbient(ducked=true){if(gain)gain.gain.value=ducked?0.01:getSoundVolume()/100*.035;}
