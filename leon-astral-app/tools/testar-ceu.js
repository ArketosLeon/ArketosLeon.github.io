// Confere o motor do app (src/ceu.ts) contra a referência Meeus completa (tools/referencia.js)
const fs=require('fs'),path=require('path');
eval(fs.readFileSync(path.join(__dirname,'../src/ceu.ts'),'utf8').replace(/^export\{.*$/m,'').replace('// @ts-nocheck',''));
const P=require('./referencia.js');let bad=0;
for(let k=0;k<20000;k++){const t=Date.UTC(1940,0,1)+Math.random()*95*365.25*864e5;if(sg(lua(t))!=sg(P.moonLon(t))||sg(sol(t))!=sg(P.sunLon(t)))bad++;}
const sp=CIDADES.findIndex(c=>c[0]=='São Paulo'),r=calcular({data:'1995-12-20',hora:'15:00',cidade:sp});
console.log('signos divergentes:',bad,'| horário de verão 20/12/1995 SP:',r.offset===-2?'ok':'ERRO');process.exit(bad||r.offset!==-2?1:0);
