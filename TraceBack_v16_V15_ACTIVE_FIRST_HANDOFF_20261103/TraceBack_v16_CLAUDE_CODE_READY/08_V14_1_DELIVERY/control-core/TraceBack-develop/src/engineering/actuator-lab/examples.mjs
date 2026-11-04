import {runScenario} from './engine.mjs';
const p=(id,type,unit)=>({id,type,unit});
export const propulsionScenario={
  id:'TB-PT-001',domain:'DOM-PROPULSION',functionId:'F-TORQUE-REQUEST',
  network:{components:[
    {id:'pedal',kind:'sensor',outputs:[p('value','normalized')]},
    {id:'ready',kind:'sensor',outputs:[p('value','boolean')]},
    {id:'limit',kind:'sensor',outputs:[p('value','normalized')]},
    {id:'vcu',kind:'ecu',inputs:[p('demand','normalized'),p('ready','boolean'),p('limit','normalized')],outputs:[p('command','normalized')]},
    {id:'inverter_motor',kind:'actuator',inputs:[p('command','normalized')],outputs:[p('response','normalized')]}
  ],wires:[
    {from:'pedal',out:'value',to:'vcu',in:'demand'},
    {from:'ready',out:'value',to:'vcu',in:'ready'},
    {from:'limit',out:'value',to:'vcu',in:'limit'},
    {from:'vcu',out:'command',to:'inverter_motor',in:'command'}
  ]},logic:{kind:'propulsion',gain:1},steps:[
    {inputs:{pedal:0.8,ready:true,limit:1},expectedActuators:{inverter_motor:0.8}},
    {inputs:{pedal:0.8,ready:true,limit:0.5},expectedActuators:{inverter_motor:0.4}},
    {inputs:{pedal:0.8,ready:false,limit:1},expectedActuators:{inverter_motor:0}}
  ]
};
export const brakeScenario={
  id:'TB-BR-001',domain:'DOM-BRAKE',functionId:'F-BRAKE-COMMAND',
  network:{components:[
    {id:'brake_pedal',kind:'sensor',outputs:[p('value','normalized')]},
    {id:'brake_ecu',kind:'ecu',inputs:[p('demand','normalized')],outputs:[p('command','normalized')]},
    {id:'brake_actuator',kind:'actuator',inputs:[p('command','normalized')],outputs:[p('response','normalized')]}
  ],wires:[
    {from:'brake_pedal',out:'value',to:'brake_ecu',in:'demand'},
    {from:'brake_ecu',out:'command',to:'brake_actuator',in:'command'}
  ]},logic:{kind:'brake',gain:1},steps:[
    {inputs:{brake_pedal:0.3},expectedActuators:{brake_actuator:0.3}},
    {inputs:{brake_pedal:1},expectedActuators:{brake_actuator:1}}
  ]
};
export const examples={propulsionScenario,brakeScenario};
export const runExamples=()=>Object.fromEntries(Object.entries(examples).map(([k,v])=>[k,runScenario(v)]));
