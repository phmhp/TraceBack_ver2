import fs from 'node:fs';import path from 'node:path';import {runEducationalBench} from '../src/gameBridge/educationalBench.ts';
const dest=process.argv[2];if(!dest)throw Error('OUTPUT_DIRECTORY_REQUIRED');fs.mkdirSync(dest,{recursive:true});
for(const id of ['PROPULSION_GATEWAY','THERMAL_FAN','BRAKE_ACTUATOR']){const data=runEducationalBench(id);const fn=path.join(dest,id+'.json');fs.writeFileSync(fn,JSON.stringify(data,null,2)+'\n');console.log(id,Object.fromEntries(Object.entries(data.results).map(([k,v])=>[k,v.verdict])),'trace records',data.trace.length);}
