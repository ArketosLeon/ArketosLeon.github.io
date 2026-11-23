/* Leon Astral — motor do céu v2 (Meeus cap. 25/47 + histórico oficial de fusos e horário de verão do Brasil, IANA tzdata) */
var R=Math.PI/180,nn=function(x){return((x%360)+360)%360};
var ML=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],[1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],[2,-1,2,0,327],[0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294]];
function jd(t){return t/864e5+2440587.5}
function dT(y){var u=y-2000;if(y<1986)return 45+(y-1975)*0.8;if(y<2005)return 63.86+0.3345*u-0.060374*u*u;return 62.92+0.32217*u+0.005589*u*u}
function TT(t){return(jd(t)+dT(new Date(t).getUTCFullYear())/86400-2451545)/36525}
function nut(T){var o=(125.04452-1934.136261*T)*R,L=(280.4665+36000.7698*T)*R,Lp=(218.3165+481267.8813*T)*R;return(-17.2*Math.sin(o)-1.32*Math.sin(2*L)-0.23*Math.sin(2*Lp)+0.21*Math.sin(2*o))/3600}
function sol(t){var T=TT(t),L0=280.46646+36000.76983*T+0.0003032*T*T,M=(357.52911+35999.05029*T-0.0001537*T*T)*R;
 var C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);
 return nn(L0+C-0.00569-0.00478*Math.sin((125.04-1934.136*T)*R))}
function lua(t){var T=TT(t),Lp=nn(218.3164477+481267.88123421*T-0.0015786*T*T),D=nn(297.8501921+445267.1114034*T-0.0018819*T*T),M=nn(357.5291092+35999.0502909*T-0.0001536*T*T),Mp=nn(134.9633964+477198.8675055*T+0.0087414*T*T),F=nn(93.272095+483202.0175233*T-0.0036539*T*T),E=1-0.002516*T-0.0000074*T*T,s=0;
 for(var i=0;i<ML.length;i++){var a=ML[i],e=Math.abs(a[1])==1?E:Math.abs(a[1])==2?E*E:1;s+=a[4]*e*Math.sin((a[0]*D+a[1]*M+a[2]*Mp+a[3]*F)*R)}
 s+=3958*Math.sin((119.75+131.849*T)*R)+1962*Math.sin((Lp-F)*R)+318*Math.sin((53.09+479264.29*T)*R);return nn(Lp+s/1e6+nut(T))}
function asc(t,lat,lon){var d=jd(t)-2451545,T=d/36525,g=nn(280.46061837+360.98564736629*d+0.000387933*T*T),ep=(23.4392911-0.0130042*T)*R,th=nn(g+lon+nut(T)*Math.cos(ep))*R;
 return nn(Math.atan2(Math.cos(th),-(Math.sin(th)*Math.cos(ep)+Math.tan(lat*R)*Math.sin(ep)))/R)}
function sg(l){return Math.floor(nn(l)/30)}
/* fuso: deslocamento em minutos na zona, num instante UTC */
function offMin(z,t){var tb=TZ[z]||TZ.Sao_Paulo,m=t/6e4,o=tb[0][1];for(var i=1;i<tb.length&&tb[i][0]<=m;i++)o=tb[i][1];return o}
/* hora local (de relógio) -> instante UTC, resolvendo horário de verão */
function utc(y,mo,d,h,mi,z){var b=Date.UTC(y,mo-1,d,h,mi),t=b-offMin(z,b)*6e4;t=b-offMin(z,t)*6e4;return t}
function fase(t){var e=nn(lua(t)-sol(t));return e<22.5||e>=337.5?"Lua Nova":e<67.5?"Lua Crescente":e<112.5?"Quarto Crescente":e<157.5?"Crescente Gibosa":e<202.5?"Lua Cheia":e<247.5?"Minguante Gibosa":e<292.5?"Quarto Minguante":"Lua Minguante"}
/* mapa natal. p={data:"AAAA-MM-DD",hora:"HH:MM"|"",cidade:indice} */
function calcular(p){var c=CIDADES[p.cidade]||CIDADES[0],q=p.data.split("-").map(Number),hh=p.hora?p.hora.split(":").map(Number):[12,0];
 var t=utc(q[0],q[1],q[2],hh[0],hh[1],c[3]),r={sun:sol(t),moon:lua(t),asc:p.hora?asc(t,c[1],c[2]):null,offset:offMin(c[3],t)/60,luaDupla:null,solDuplo:null};
 if(!p.hora){var a=utc(q[0],q[1],q[2],0,0,c[3]),b=utc(q[0],q[1],q[2],23,59,c[3]);
  if(sg(lua(a))!=sg(lua(b)))r.luaDupla=[sg(lua(a)),sg(lua(b))];if(sg(sol(a))!=sg(sol(b)))r.solDuplo=[sg(sol(a)),sg(sol(b))]}
 return r}
/* céu de agora + próxima troca de signo da Lua (busca binária, precisão de 1 min) */
function ceuAgora(t){t=t||Date.now();var l=lua(t),s=sg(l),a=t,b=t+3*864e5;while(sg(lua(b))==s)b+=864e5;while(b-a>6e4){var m=(a+b)/2;if(sg(lua(m))==s)a=m;else b=m}
 return{lua:l,luaSigno:s,proxSigno:(s+1)%12,trocaEm:b,sol:sol(t),solSigno:sg(sol(t)),fase:fase(t)}}
