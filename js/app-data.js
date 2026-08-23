'use strict';
/* ================= cloud config ================= */
const SB_URL='https://sqvybphogacjcqesktos.supabase.co/rest/v1/';
const SB_KEY='sb_publishable_goW4R2ia5-t_gdngFx8tsw_ixrgHuih';
const HDR={apikey:SB_KEY, Authorization:'Bearer '+SB_KEY, 'Content-Type':'application/json'};

/* ================= exercise library ================= */
const GROUPS=['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core'];
const GLABEL={chest:'Chest',back:'Back',shoulders:'Shoulders',biceps:'Biceps',triceps:'Triceps',quads:'Quads',hamstrings:'Hamstrings',glutes:'Glutes',calves:'Calves',core:'Core'};
const QUICKS={'Push':['chest','shoulders','triceps'],'Pull':['back','biceps'],'Legs':['quads','hamstrings','glutes','calves'],'Full Body':['chest','back','shoulders','quads','hamstrings','glutes','core']};
const EXLIB=[
 {n:'Back Squat',g:['quads','glutes'],eq:['bb','rack'],t:'c',tags:['axial']},
 {n:'Front Squat',g:['quads','core'],eq:['bb','rack'],t:'c',tags:['axial']},
 {n:'Deadlift',g:['hamstrings','glutes','back'],eq:['bb'],t:'c',tags:['axial']},
 {n:'Romanian Deadlift',g:['hamstrings','glutes'],eq:['bb'],t:'c',tags:['axial']},
 {n:'Bench Press',g:['chest','triceps'],eq:['bb','bench','rack'],t:'c'},
 {n:'Close-Grip Bench Press',g:['triceps','chest'],eq:['bb','bench','rack'],t:'c'},
 {n:'Strict Press',g:['shoulders','triceps'],eq:['bb'],t:'c'},
 {n:'Push Press',g:['shoulders'],eq:['bb'],t:'c'},
 {n:'Barbell Row',g:['back','biceps'],eq:['bb'],t:'c'},
 {n:'Power Clean',g:['hamstrings','back','shoulders'],eq:['bb'],t:'c'},
 {n:'Hang Squat Clean',g:['quads','hamstrings','shoulders'],eq:['bb'],t:'c'},
 {n:'Hip Thrust',g:['glutes'],eq:['bb','bench'],t:'c'},
 {n:'Glute Bridge',g:['glutes'],eq:['bb'],t:'i'},
 {n:'Barbell Curl',g:['biceps'],eq:['bb'],t:'i'},
 {n:'Skull Crusher',g:['triceps'],eq:['bb','bench'],t:'i'},
 {n:'Shrug',g:['back'],eq:['bb'],t:'i'},
 {n:'Overhead Squat',g:['quads','shoulders','core'],eq:['bb'],t:'c'},
 {n:'Thruster',g:['quads','shoulders'],eq:['bb'],t:'c'},
 {n:'DB Bench Press',g:['chest','triceps'],eq:['db','bench'],t:'c'},
 {n:'DB Floor Press',g:['chest','triceps'],eq:['db'],t:'c'},
 {n:'DB Shoulder Press',g:['shoulders'],eq:['db'],t:'c'},
 {n:'Single-Arm DB Row',g:['back'],eq:['db'],t:'c',ps:1,side:'arm'},
 {n:'DB Romanian Deadlift',g:['hamstrings','glutes'],eq:['db'],t:'c'},
 {n:'Reverse Lunge',g:['quads','glutes'],eq:['db'],t:'c',ps:1,side:'leg'},
 {n:'Bulgarian Split Squat',g:['quads','glutes'],eq:['db','bench'],t:'c',ps:1,side:'leg'},
 {n:'Step-Up',g:['quads','glutes'],eq:['db','bench'],t:'c',ps:1,side:'leg'},
 {n:'Goblet Squat',g:['quads','glutes'],eq:['db'],t:'c',tags:[]},
 {n:'Calf Raise',g:['calves'],eq:['db'],t:'i'},
 {n:'DB Curl',g:['biceps'],eq:['db'],t:'i'},
 {n:'Hammer Curl',g:['biceps'],eq:['db'],t:'i'},
 {n:'Eccentric DB Curl',g:['biceps'],eq:['db'],t:'i'},
 {n:'Lateral Raise',g:['shoulders'],eq:['db'],t:'i',ps:1,side:'arm'},
 {n:'DB Lateral Raise',g:['shoulders'],eq:['db'],t:'i',ps:1,side:'arm'},
 {n:'Front Raise',g:['shoulders'],eq:['db'],t:'i'},
 {n:'Rear Delt Raise',g:['shoulders','back'],eq:['db'],t:'i'},
 {n:'Overhead Triceps Extension',g:['triceps'],eq:['db'],t:'i'},
 {n:'Tricep Kickback',g:['triceps'],eq:['db'],t:'i',ps:1,side:'arm'},
 {n:'DB Pullover',g:['chest','back'],eq:['db','bench'],t:'i'},
 {n:'Farmer Hold',g:['core'],eq:['db'],t:'i'},
 {n:'KB Swing',g:['glutes','hamstrings'],eq:['kb'],t:'c'},
 {n:'Single-Arm KB Press',g:['shoulders'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Gorilla Row',g:['back'],eq:['kb'],t:'c'},
 {n:'KB Romanian Deadlift',g:['hamstrings','glutes'],eq:['kb'],t:'c'},
 {n:'KB Floor Press',g:['chest','triceps'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Curl',g:['biceps'],eq:['kb'],t:'i'},
 {n:'KB Goblet Squat',g:['quads','glutes'],eq:['kb'],t:'c'},
 {n:'Pull-Up',g:['back','biceps'],eq:['pullup'],t:'c'},
 {n:'Chin-Up',g:['biceps','back'],eq:['pullup'],t:'c'},
 {n:'Chest-to-Bar Pull-Up',g:['back'],eq:['pullup'],t:'c'},
 {n:'High Pull-Up',g:['back'],eq:['pullup'],t:'c'},
 {n:'Muscle-Up',g:['back','chest','triceps'],eq:['pullup'],t:'c'},
 {n:'Muscle-Up Negative',g:['back','chest'],eq:['pullup'],t:'c'},
 {n:'Straight-Bar Dip',g:['chest','triceps'],eq:['pullup'],t:'c'},
 {n:'Dead Hang',g:['core'],eq:['pullup'],t:'i'},
 {n:'Hanging Leg Raise',g:['core'],eq:['pullup'],t:'i'},
 {n:'Push-Up',g:['chest','triceps'],eq:[],t:'c',tags:['floor']},
 {n:'Weighted Push-Up',g:['chest','triceps'],eq:[],t:'c'},
 {n:'Plank',g:['core'],eq:[],t:'i'},
 {n:'Weighted Sit-Up',g:['core'],eq:[],t:'i'},
 {n:'Sit-Up',g:['core'],eq:[],t:'i'},
 {n:'Single-Leg Glute Bridge',g:['glutes'],eq:[],t:'i',ps:1,side:'leg'},
 {n:'Bodyweight Squat',g:['quads'],eq:[],t:'c'},
 {n:'Burpee',g:['chest','quads','core'],eq:[],t:'c',tags:['impact']}
];
EXLIB.push(
 {n:'Pause Squat',g:['quads','glutes'],eq:['bb','rack'],t:'c'},
 {n:'Sumo Deadlift',g:['glutes','hamstrings'],eq:['bb'],t:'c'},
 {n:'Good Morning',g:['hamstrings','back'],eq:['bb'],t:'c'},
 {n:'Pendlay Row',g:['back'],eq:['bb'],t:'c'},
 {n:'Zercher Squat',g:['quads','core'],eq:['bb','rack'],t:'c'},
 {n:'Barbell Lunge',g:['quads','glutes'],eq:['bb'],t:'c',ps:1,side:'leg'},
 {n:'Rack Pull',g:['back','glutes'],eq:['bb','rack'],t:'c'},
 {n:'Barbell Floor Press',g:['chest','triceps'],eq:['bb'],t:'c'},
 {n:'Snatch',g:['shoulders','hamstrings'],eq:['bb'],t:'c'},
 {n:'Power Snatch',g:['shoulders','hamstrings'],eq:['bb'],t:'c'},
 {n:'Clean & Jerk',g:['quads','shoulders'],eq:['bb'],t:'c'},
 {n:'Hang Power Clean',g:['hamstrings','back'],eq:['bb'],t:'c'},
 {n:'Push Jerk',g:['shoulders'],eq:['bb'],t:'c'},
 {n:'Split Jerk',g:['shoulders'],eq:['bb'],t:'c'},
 {n:'Seated Strict Press',g:['shoulders'],eq:['bb','bench'],t:'c'},
 {n:'Upright Row',g:['shoulders','back'],eq:['bb'],t:'i'},
 {n:'Reverse Curl',g:['biceps'],eq:['bb'],t:'i'},
 {n:'JM Press',g:['triceps'],eq:['bb','bench'],t:'i'},
 {n:'Barbell Calf Raise',g:['calves'],eq:['bb','rack'],t:'i'},
 {n:'DB Fly',g:['chest'],eq:['db','bench'],t:'i'},
 {n:'DB Floor Fly',g:['chest'],eq:['db'],t:'i'},
 {n:'Arnold Press',g:['shoulders'],eq:['db'],t:'c'},
 {n:'Seated DB Press',g:['shoulders'],eq:['db','bench'],t:'c'},
 {n:'Renegade Row',g:['back','core'],eq:['db'],t:'c',ps:1,side:'arm',tags:['floor']},
 {n:'DB Deadlift',g:['hamstrings','glutes'],eq:['db'],t:'c'},
 {n:'DB Front Squat',g:['quads'],eq:['db'],t:'c'},
 {n:'DB Thruster',g:['quads','shoulders'],eq:['db'],t:'c'},
 {n:'DB Push Press',g:['shoulders'],eq:['db'],t:'c'},
 {n:'DB Snatch',g:['shoulders','hamstrings'],eq:['db'],t:'c',ps:1,side:'arm'},
 {n:'DB Clean',g:['hamstrings'],eq:['db'],t:'c'},
 {n:'DB Row',g:['back'],eq:['db'],t:'c'},
 {n:'Zottman Curl',g:['biceps'],eq:['db'],t:'i'},
 {n:'Concentration Curl',g:['biceps'],eq:['db'],t:'i',ps:1,side:'arm'},
 {n:'Cross-Body Hammer Curl',g:['biceps'],eq:['db'],t:'i',ps:1,side:'arm'},
 {n:'DB Skull Crusher',g:['triceps'],eq:['db','bench'],t:'i'},
 {n:'DB Upright Row',g:['shoulders'],eq:['db'],t:'i'},
 {n:'DB Shrug',g:['back'],eq:['db'],t:'i'},
 {n:'Walking Lunge',g:['quads','glutes'],eq:['db'],t:'c',ps:1,side:'leg'},
 {n:'Forward Lunge',g:['quads','glutes'],eq:['db'],t:'c',ps:1,side:'leg'},
 {n:'Lateral Lunge',g:['quads','glutes'],eq:['db'],t:'c',ps:1,side:'leg'},
 {n:'Single-Leg RDL',g:['hamstrings','glutes'],eq:['db'],t:'c',ps:1,side:'leg'},
 {n:'Single-Leg Calf Raise',g:['calves'],eq:['db'],t:'i',ps:1,side:'leg'},
 {n:'Seated Calf Raise',g:['calves'],eq:['db','bench'],t:'i'},
 {n:'Suitcase Carry',g:['core'],eq:['db'],t:'i',ps:1,side:'arm'},
 {n:'DB Side Bend',g:['core'],eq:['db'],t:'i'},
 {n:'KB Deadlift',g:['hamstrings','glutes'],eq:['kb'],t:'c'},
 {n:'KB Front Rack Squat',g:['quads'],eq:['kb'],t:'c'},
 {n:'KB Clean',g:['hamstrings'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Clean & Press',g:['shoulders'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Snatch',g:['shoulders','hamstrings'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'Turkish Get-Up',g:['core','shoulders'],eq:['kb'],t:'c',ps:1,tags:['floor'],side:'arm'},
 {n:'KB Windmill',g:['core'],eq:['kb'],t:'i',ps:1,side:'arm'},
 {n:'KB Halo',g:['shoulders','core'],eq:['kb'],t:'i'},
 {n:'KB High Pull',g:['shoulders'],eq:['kb'],t:'c'},
 {n:'KB Push Press',g:['shoulders'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Shrug',g:['back'],eq:['kb'],t:'i'},
 {n:'KB Single-Leg RDL',g:['hamstrings'],eq:['kb'],t:'c',ps:1,side:'leg'},
 {n:'KB Suitcase Carry',g:['core'],eq:['kb'],t:'i',ps:1,side:'arm'},
 {n:'Goblet Lunge',g:['quads','glutes'],eq:['kb'],t:'c',ps:1,side:'leg'},
 {n:'Jump Squat',g:['quads'],eq:[],t:'c',tags:['impact']},
 {n:'Pistol Squat',g:['quads'],eq:[],t:'c',ps:1,side:'leg'},
 {n:'Split Squat',g:['quads','glutes'],eq:[],t:'c',ps:1,side:'leg'},
 {n:'Wall Sit',g:['quads'],eq:[],t:'i'},
 {n:'Glute Kickback',g:['glutes'],eq:[],t:'i',ps:1,side:'leg'},
 {n:'Bird Dog',g:['core'],eq:[],t:'i'},
 {n:'Dead Bug',g:['core'],eq:[],t:'i'},
 {n:'Hollow Hold',g:['core'],eq:[],t:'i'},
 {n:'Superman Hold',g:['back','core'],eq:[],t:'i'},
 {n:'Russian Twist',g:['core'],eq:[],t:'i'},
 {n:'V-Up',g:['core'],eq:[],t:'i'},
 {n:'Side Plank',g:['core'],eq:[],t:'i',ps:1},
 {n:'Mountain Climber',g:['core'],eq:[],t:'i'},
 {n:'Crunch',g:['core'],eq:[],t:'i'},
 {n:'Reverse Crunch',g:['core'],eq:[],t:'i'},
 {n:'Flutter Kicks',g:['core'],eq:[],t:'i'},
 {n:'Diamond Push-Up',g:['triceps','chest'],eq:[],t:'c'},
 {n:'Wide Push-Up',g:['chest'],eq:[],t:'c'},
 {n:'Pike Push-Up',g:['shoulders'],eq:[],t:'c'},
 {n:'Handstand Push-Up',g:['shoulders'],eq:[],t:'c'},
 {n:'Archer Push-Up',g:['chest'],eq:[],t:'c'},
 {n:'Wall Walk',g:['shoulders','core'],eq:[],t:'c'},
 {n:'Bodyweight Glute Bridge',g:['glutes'],eq:[],t:'i'},
 {n:'Decline Push-Up',g:['chest','shoulders'],eq:['bench'],t:'c'},
 {n:'Bench Dip',g:['triceps'],eq:['bench'],t:'c'},
 {n:'Inverted Row',g:['back'],eq:['bb','rack'],t:'c'},
 {n:'Scapular Pull-Up',g:['back'],eq:['pullup'],t:'i'},
 {n:'Negative Pull-Up',g:['back'],eq:['pullup'],t:'c'},
 {n:'Commando Pull-Up',g:['back','biceps'],eq:['pullup'],t:'c'},
 {n:'Toes-to-Bar',g:['core'],eq:['pullup'],t:'i'},
 {n:'Knees-to-Elbows',g:['core'],eq:['pullup'],t:'i'},
 {n:'L-Sit Hold',g:['core'],eq:['pullup'],t:'i'},
 {n:'Band Pull-Apart',g:['shoulders','back'],eq:['band'],t:'i',tags:[]},
 {n:'Band Face Pull',g:['shoulders','back'],eq:['band'],t:'i'},
 {n:'Band Lateral Walk',g:['glutes'],eq:['band'],t:'i'},
 {n:'Band Glute Kickback',g:['glutes'],eq:['band'],t:'i',ps:1,side:'leg'},
 {n:'Band Row',g:['back'],eq:['band'],t:'c',tags:[]},
 {n:'Band Overhead Press',g:['shoulders'],eq:['band'],t:'c'},
 {n:'Band Curl',g:['biceps'],eq:['band'],t:'i'},
 {n:'Band Pushdown',g:['triceps'],eq:['band'],t:'i'},
 {n:'Band Good Morning',g:['hamstrings'],eq:['band'],t:'i'},
 {n:'Incline Bench Press',g:['chest','shoulders'],eq:['bb','incline','rack'],t:'c'},
 {n:'Incline DB Press',g:['chest','shoulders'],eq:['db','incline'],t:'c'},
 {n:'Incline DB Fly',g:['chest'],eq:['db','incline'],t:'i'},
 {n:'Incline DB Curl',g:['biceps'],eq:['db','incline'],t:'i'},
 {n:'Dip',g:['chest','triceps'],eq:['dip'],t:'c'},
 {n:'Weighted Dip',g:['chest','triceps'],eq:['dip'],t:'c'},
 {n:'Box Jump',g:['quads'],eq:['box'],t:'c',tags:['impact']},
 {n:'Box Step-Up',g:['quads','glutes'],eq:['box'],t:'c',ps:1,side:'leg'},
 /* ---- kettlebell expansion ---- */
 {n:'Single-Arm KB Row',g:['back','biceps'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Overhead Dead Bug',g:['core','shoulders'],eq:['kb'],t:'i'},
 {n:'KB Shoulder Press',g:['shoulders','triceps'],eq:['kb'],t:'c'},
 {n:'KB Thruster',g:['quads','shoulders'],eq:['kb'],t:'c'},
 {n:'KB Sumo Deadlift',g:['glutes','hamstrings'],eq:['kb'],t:'c'},
 {n:'KB Split Squat',g:['quads','glutes'],eq:['kb'],t:'c',ps:1,side:'leg'},
 {n:'KB Reverse Lunge',g:['quads','glutes'],eq:['kb'],t:'c',ps:1,side:'leg'},
 {n:'KB Curtsy Lunge',g:['glutes'],eq:['kb'],t:'c',ps:1,side:'leg'},
 {n:'KB Bulgarian Split Squat',g:['quads','glutes'],eq:['kb','bench'],t:'c',ps:1,side:'leg'},
 {n:'KB Step-Up',g:['quads','glutes'],eq:['kb','bench'],t:'c',ps:1,side:'leg'},
 {n:'KB Lateral Raise',g:['shoulders'],eq:['kb'],t:'i',ps:1,side:'arm'},
 {n:'KB Upright Row',g:['shoulders','back'],eq:['kb'],t:'i'},
 {n:'KB Renegade Row',g:['back','core'],eq:['kb'],t:'c',ps:1,side:'arm',tags:['floor']},
 {n:'KB Around the World',g:['shoulders','core'],eq:['kb'],t:'i'},
 {n:'KB Figure 8',g:['core','back'],eq:['kb'],t:'i'},
 {n:'KB Suitcase Deadlift',g:['glutes','core'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Overhead Squat',g:['quads','shoulders','core'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Crush Grip Press',g:['chest','triceps'],eq:['kb'],t:'c'},
 {n:'KB Pullover',g:['back','chest'],eq:['kb'],t:'i'},
 {n:'KB Skull Crusher',g:['triceps'],eq:['kb'],t:'i'},
 {n:'KB Hammer Curl',g:['biceps'],eq:['kb'],t:'i'},
 {n:'KB Tricep Extension',g:['triceps'],eq:['kb'],t:'i'},
 {n:'KB Russian Twist',g:['core'],eq:['kb'],t:'i'},
 {n:'KB Sit-Up',g:['core'],eq:['kb'],t:'i'},
 {n:'KB Rack Carry',g:['core','shoulders'],eq:['kb'],t:'i'},
 {n:'KB Overhead Carry',g:['shoulders','core'],eq:['kb'],t:'i',ps:1,side:'arm'},
 {n:'KB Good Morning',g:['hamstrings','back'],eq:['kb'],t:'c'},
 {n:'KB Hip Thrust',g:['glutes'],eq:['kb'],t:'c'},
 {n:'KB Glute Bridge',g:['glutes'],eq:['kb'],t:'i'},
 {n:'KB Calf Raise',g:['calves'],eq:['kb'],t:'i'},
 {n:'KB Bent Press',g:['core','shoulders'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Single-Arm Swing',g:['glutes','hamstrings'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Dead Stop Swing',g:['glutes','hamstrings'],eq:['kb'],t:'c'},
 {n:'KB Alternating Press',g:['shoulders'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Seesaw Press',g:['shoulders'],eq:['kb'],t:'c',ps:1,side:'arm'},
 {n:'KB Chest Supported Row',g:['back'],eq:['kb','bench'],t:'c'},
 {n:'KB Plank Drag',g:['core'],eq:['kb'],t:'i'},
 {n:'KB Sit & Press',g:['shoulders','core'],eq:['kb'],t:'c'}
);
EXLIB.push(
 {n:'Sit-to-Stand',g:['quads','glutes'],eq:[],t:'c',tags:[]},
 {n:'Chair Squat',g:['quads','glutes'],eq:[],t:'c',tags:[]},
 {n:'DB Squat',g:['quads','glutes'],eq:['db'],t:'c'},
 {n:'Floor Press',g:['chest','triceps'],eq:['bb'],t:'c'},
 {n:'Incline Push-Up',g:['chest','triceps'],eq:[],t:'c',tags:[]},
 {n:'Wall Push-Up',g:['chest','triceps'],eq:[],t:'c',tags:[]},
 {n:'Band Lat Pulldown',g:['back'],eq:['band'],t:'c'}
);
const LIB={}; EXLIB.forEach(e=>LIB[e.n]=e);
function sideOf(ex){
  const n=ex&&typeof ex==='object'? (ex.ex||ex.n) : ex;
  const l=LIB[n];
  if(l&&l.side) return l.side;
  if(/Lateral Raise$/i.test(n||'')) return 'arm';
  return null;
}
function perSide(ex){
  const s=sideOf(ex);
  return s? '(per '+s+')' : '';
}
function tgtSide(ex){
  const l=typeof ex==='string'? LIB[ex] : ex;
  if(!l||!l.ps) return '';
  return l.side? '/'+l.side : '/side';
}
/* substitution ladders — best → last resort. Walk, do not rank. */
const TREES={
  SQUAT:['Back Squat','Front Squat','Goblet Squat','DB Squat','Sit-to-Stand','Chair Squat'],
  HINGE:['Deadlift','Romanian Deadlift','DB Deadlift','KB Swing','Band Good Morning'],
  CHEST:['Bench Press','DB Bench Press','Floor Press','DB Floor Press','Push-Up','Incline Push-Up','Wall Push-Up'],
  OH:['Strict Press','Push Press','DB Shoulder Press','KB Sit & Press','Band Overhead Press'],
  PULL_VERT:['Weighted Pull-Up','Pull-Up','Chin-Up','Band Lat Pulldown'],
  PULL_HORIZ:['Pendlay Row','Barbell Row','Single-Arm DB Row','DB Row','Band Row','Inverted Row']
};
const TREE_LABEL={SQUAT:'Squat',HINGE:'Hinge',CHEST:'Chest',OH:'Overhead',PULL_VERT:'Pull',PULL_HORIZ:'Row'};
/* ---- cardio ---- */
const CARDIO=[
 {n:'Walk',i:'\ud83d\udeb6',d:1},{n:'Brisk Walk',i:'\ud83d\udeb6\u200d\u2642\ufe0f',d:1},{n:'Hike',i:'\ud83e\udd7e',d:1},{n:'Run',i:'\ud83c\udfc3',d:1},
 {n:'Cycle (outdoor)',i:'\ud83d\udeb4',d:1},{n:'Swim',i:'\ud83c\udfca',d:1},{n:'Stairs',i:'\ud83e\uddfc',d:0},{n:'Skipping',i:'\ud83e\udea2',d:0},
 {n:'Treadmill',i:'\ud83c\udfc3\u200d\u2640\ufe0f',d:1,m:1},{n:'Exercise Bike',i:'\ud83d\udeb2',d:1,m:1},{n:'Rowing Machine',i:'\ud83d\udea3',d:1,m:1},
 {n:'Elliptical',i:'\u2699\ufe0f',d:1,m:1},{n:'Stair Climber',i:'\ud83e\uddd7',d:0,m:1},{n:'Ski Erg',i:'\u26f7\ufe0f',d:1,m:1},
 {n:'Air Bike',i:'\ud83d\udca8',d:1,m:1},{n:'Spin Class',i:'\ud83d\udeb4\u200d\u2640\ufe0f',d:0,m:1},{n:'Other Cardio',i:'\u2764\ufe0f',d:1,m:1}
];
const CARDIO_N=new Set(CARDIO.map(c=>c.n));
const INTENSITY={easy:{l:'Easy',x:1,d:'could chat easily'},moderate:{l:'Moderate',x:1.5,d:'breathing harder'},hard:{l:'Hard',x:2,d:'can barely talk'}};
const cardioPts=e=>Math.round((e.mins||0)*((INTENSITY[e.intensity]||INTENSITY.easy).x));
const PARAMS={
 strength:{sets:4,repC:'4–6',repI:'8–10',restC:180,restI:120},
 muscle:{sets:4,repC:'6–10',repI:'10–12',restC:150,restI:90},
 tone:{sets:3,repC:'10–12',repI:'12–15',restC:90,restI:60}
};
const EQUIP_DEF={rack:true,bb:true,bench:true,incline:false,pullup:true,dip:false,box:false,db:true,kb:true,band:false,
  rower:false,bike:false,tread:false,ellip:false,rope:false,plateskg:100,dbw:'22.5',dbpair:true,kbw:'',kbpair:false};
const EQ_LABEL={rack:'Squat rack',bb:'Olympic barbell + plates',bench:'Flat bench',incline:'Adjustable / incline bench',pullup:'Pull-up bar',dip:'Dip bars / station',box:'Plyo box',db:'Dumbbells',kb:'Kettlebells',band:'Resistance bands'};
const EQ_CARDIO={rower:'Rowing machine',bike:'Exercise bike',tread:'Treadmill',ellip:'Elliptical',rope:'Skipping rope'};

const KEY=(window.GG_PRACTICE_KEY||'garageGymTracker_practice_v1'), OLDKEY='garageGymTracker_v2';
const PALETTE=['#ff5029','#39b6d6']; /* logo colours only; house colour is derived from user.who */
const WHO_M=['#ff5029','#e0743a'];
const WHO_F=['#39b6d6','#2aa3c2'];
const TEMPLATES=[
 {key:'A',bdg:'DAY A',group:'core',name:'Lower — Squat',sub:'quads · glutes · core',color:'#e03a3a',items:[
   {ex:'Back Squat',sets:4,tgt:'5–8'},{ex:'Front Squat',sets:3,tgt:'6–10'},{ex:'Reverse Lunge',sets:3,tgt:'10/leg'},{ex:'Calf Raise',sets:3,tgt:'12–15'},{ex:'Hanging Leg Raise',sets:3,tgt:'10–15'}]},
 {key:'B',bdg:'DAY B',group:'core',name:'Pull',sub:'back · biceps',color:'#3a6ea5',items:[
   {ex:'Pull-Up',sets:4,tgt:'6–10'},{ex:'Barbell Row',sets:4,tgt:'8–10'},{ex:'Single-Arm DB Row',sets:3,tgt:'10–12'},{ex:'Barbell Curl',sets:4,tgt:'8–12'},{ex:'Eccentric DB Curl',sets:2,tgt:'6–8'},{ex:'KB Gorilla Row',sets:3,tgt:'12–15'}]},
 {key:'C',bdg:'DAY C',group:'core',name:'Lower — Hinge',sub:'hamstrings · glutes · back',color:'#e03a3a',items:[
   {ex:'Power Clean',sets:4,tgt:'2–3 (opt)'},{ex:'Deadlift',sets:4,tgt:'4–6'},{ex:'Romanian Deadlift',sets:3,tgt:'8–10'},{ex:'Bulgarian Split Squat',sets:3,tgt:'8–10'},{ex:'Hip Thrust',sets:3,tgt:'10–12'},{ex:'Weighted Sit-Up',sets:3,tgt:'12–15'}]},
 {key:'D',bdg:'DAY D',group:'core',name:'Push',sub:'chest · shoulders · triceps',color:'#3a6ea5',items:[
   {ex:'Push Press',sets:4,tgt:'2–3 (opt)'},{ex:'Bench Press',sets:4,tgt:'6–10'},{ex:'Strict Press',sets:3,tgt:'5–8'},{ex:'DB Bench Press',sets:3,tgt:'8–12'},{ex:'Lateral Raise',sets:3,tgt:'12–15'},{ex:'Overhead Triceps Extension',sets:3,tgt:'10–12'},{ex:'Hammer Curl',sets:3,tgt:'10–12'}]},
 {key:'BE',bdg:'BENCH',group:'flavour',name:'Benchmark',sub:'chest · triceps · bro certified',color:'#7c5cff',items:[
   {ex:'Bench Press',sets:4,tgt:'5–8'},{ex:'Close-Grip Bench Press',sets:3,tgt:'8–10'},{ex:'DB Bench Press',sets:3,tgt:'8–12'},{ex:'Weighted Push-Up',sets:3,tgt:'max−2'},{ex:'Skull Crusher',sets:3,tgt:'10–12'},{ex:'Hammer Curl',sets:3,tgt:'10–12'}]},
 {key:'GUN',bdg:'GUNS',group:'flavour',name:"Sun's Out, Guns Out",sub:'biceps · triceps · pure pump',color:'#e0743a',items:[
   {ex:'Chin-Up',sets:3,tgt:'submax'},{ex:'Barbell Curl',sets:4,tgt:'8–12'},{ex:'Skull Crusher',sets:4,tgt:'10–12'},{ex:'Hammer Curl',sets:3,tgt:'10–12'},{ex:'Overhead Triceps Extension',sets:3,tgt:'10–12'},{ex:'Eccentric DB Curl',sets:2,tgt:'6–8'}]},
 {key:'SH',bdg:'DELTS',group:'flavour',name:'Boulder Shoulders',sub:'delts · traps',color:'#3a6ea5',items:[
   {ex:'Strict Press',sets:4,tgt:'5–8'},{ex:'Push Press',sets:3,tgt:'6–8'},{ex:'Lateral Raise',sets:4,tgt:'12–15'},{ex:'Front Raise',sets:3,tgt:'12'},{ex:'Rear Delt Raise',sets:3,tgt:'12–15'},{ex:'Shrug',sets:3,tgt:'12–15'}]},
 {key:'G',bdg:'GLUTES',group:'flavour',name:'Peach Season',sub:'glutes · hamstrings',color:'#e05a9b',items:[
   {ex:'Hip Thrust',sets:4,tgt:'8–12'},{ex:'Romanian Deadlift',sets:3,tgt:'8–10'},{ex:'Bulgarian Split Squat',sets:3,tgt:'8–10/leg'},{ex:'KB Swing',sets:3,tgt:'12–15'},{ex:'Reverse Lunge',sets:3,tgt:'10/leg'},{ex:'Single-Leg Glute Bridge',sets:2,tgt:'12/leg'}]},
 {key:'L',bdg:'LEGS',group:'flavour',name:'Legs for Days',sub:'quads · calves · core',color:'#e05a9b',items:[
   {ex:'Goblet Squat',sets:4,tgt:'10–12'},{ex:'Step-Up',sets:3,tgt:'10/leg'},{ex:'Reverse Lunge',sets:3,tgt:'10/leg'},{ex:'Calf Raise',sets:4,tgt:'12–15'},{ex:'Weighted Sit-Up',sets:3,tgt:'12–15'},{ex:'Plank',sets:3,tgt:'45–60 s'}]},
 {key:'U',bdg:'UPPER',group:'flavour',name:'Strong & Sculpted',sub:'back · shoulders · arms',color:'#2bb3a3',items:[
   {ex:'Single-Arm DB Row',sets:4,tgt:'10–12'},{ex:'DB Bench Press',sets:3,tgt:'8–12'},{ex:'Single-Arm KB Press',sets:3,tgt:'8–10/arm'},{ex:'Lateral Raise',sets:3,tgt:'12–15'},{ex:'KB Curl',sets:3,tgt:'10–12'},{ex:'Tricep Kickback',sets:3,tgt:'12/arm'}]},
 {key:'H1',bdg:'HALF 1',group:'half',name:'Damage Control 1',sub:'squat + push · covers half the body',color:'#7c5cff',items:[
   {ex:'Back Squat',sets:4,tgt:'6–8'},{ex:'Bench Press',sets:4,tgt:'6–10'},{ex:'Strict Press',sets:3,tgt:'6–8'},{ex:'Reverse Lunge',sets:2,tgt:'10/leg'},{ex:'Lateral Raise',sets:3,tgt:'12–15'},{ex:'Overhead Triceps Extension',sets:3,tgt:'10–12'},{ex:'Hanging Leg Raise',sets:3,tgt:'10–15'}]},
 {key:'H2',bdg:'HALF 2',group:'half',name:'Damage Control 2',sub:'hinge + pull · covers the other half',color:'#7c5cff',items:[
   {ex:'Deadlift',sets:4,tgt:'4–6'},{ex:'Pull-Up',sets:4,tgt:'6–10'},{ex:'Barbell Row',sets:3,tgt:'8–10'},{ex:'Hip Thrust',sets:3,tgt:'10–12'},{ex:'Barbell Curl',sets:3,tgt:'8–12'},{ex:'Hammer Curl',sets:2,tgt:'10–12'},{ex:'Weighted Sit-Up',sets:3,tgt:'12–15'}]},
 {key:'MU',bdg:'SKILL',group:'skill',name:'Muscle-Up Skill',sub:'10–15 min opener',color:'#f0b429',items:[
   {ex:'Chest-to-Bar Pull-Up',sets:4,tgt:'3–5'},{ex:'Muscle-Up Negative',sets:3,tgt:'2–3'},{ex:'High Pull-Up',sets:5,tgt:'2–3'},{ex:'Straight-Bar Dip',sets:4,tgt:'5–8'},{ex:'Dead Hang',sets:3,tgt:'max s'}]},
 {key:'K',bdg:'KB',group:'extra',name:'Kettlebell Pump',sub:'full body · KBs only',color:'#2bb3a3',items:[
   {ex:'KB Goblet Squat',sets:3,tgt:'10–12'},{ex:'Single-Arm KB Press',sets:3,tgt:'8–10/arm'},{ex:'KB Gorilla Row',sets:4,tgt:'10–12'},{ex:'KB Romanian Deadlift',sets:3,tgt:'10–12'},{ex:'KB Floor Press',sets:3,tgt:'10–12/arm'},{ex:'KB Curl',sets:3,tgt:'10–12'}]},
 {key:'KB2',bdg:'KB',group:'extra',name:'Kettlebell Strength',sub:'heavier KB work · full body',color:'#2bb3a3',items:[
   {ex:'KB Front Rack Squat',sets:4,tgt:'8–10'},{ex:'Single-Arm KB Row',sets:4,tgt:'10–12/arm'},{ex:'KB Shoulder Press',sets:3,tgt:'8–10'},{ex:'KB Romanian Deadlift',sets:3,tgt:'10–12'},{ex:'KB Reverse Lunge',sets:3,tgt:'10/leg'},{ex:'KB Overhead Dead Bug',sets:3,tgt:'8–10'}]},
 {key:'KB3',bdg:'KB',group:'extra',name:'Kettlebell Flow',sub:'swings · carries · conditioning feel',color:'#2bb3a3',items:[
   {ex:'KB Swing',sets:4,tgt:'15'},{ex:'KB Clean & Press',sets:3,tgt:'8/arm'},{ex:'KB Goblet Squat',sets:3,tgt:'12'},{ex:'KB Renegade Row',sets:3,tgt:'8/side'},{ex:'KB Rack Carry',sets:3,tgt:'40 m'},{ex:'KB Russian Twist',sets:3,tgt:'20'}]},
 {key:'KB4',bdg:'KB',group:'extra',name:'KB Glutes & Core',sub:'posterior chain · KBs only',color:'#e05a9b',items:[
   {ex:'KB Sumo Deadlift',sets:4,tgt:'10–12'},{ex:'KB Hip Thrust',sets:3,tgt:'12'},{ex:'KB Single-Leg RDL',sets:3,tgt:'10/leg'},{ex:'KB Curtsy Lunge',sets:3,tgt:'10/leg'},{ex:'KB Overhead Dead Bug',sets:3,tgt:'10'},{ex:'KB Russian Twist',sets:3,tgt:'20'}]},
 {key:'CARD',bdg:'CARDIO',group:'extra',name:'Cardio & Core',sub:'machine or walk + core finisher',color:'#e0743a',items:[
   {ex:'__CARDIO__',sets:1,tgt:'20 min'},{ex:'Plank',sets:3,tgt:'45–60 s'},{ex:'Dead Bug',sets:3,tgt:'10/side'},{ex:'Russian Twist',sets:3,tgt:'20'},{ex:'Hollow Hold',sets:3,tgt:'30 s'}]},
 {key:'S',bdg:'SPARE',group:'extra',name:'Spare-Day Pump',sub:'arms · shoulders · core',color:'#4a4f55',items:[
   {ex:'Chin-Up',sets:3,tgt:'submax'},{ex:'Hammer Curl',sets:3,tgt:'10–12'},{ex:'Single-Arm KB Press',sets:3,tgt:'8–10'},{ex:'Dead Hang',sets:3,tgt:'max s'},{ex:'Plank',sets:3,tgt:'45–60 s'}]}
];
const CYCLE=['A','B','C','D'];
const BW_MOVES=new Set(EXLIB.filter(e=>e.eq.length===0||e.eq.includes('pullup')||e.eq.includes('dip')).map(e=>e.n));
BW_MOVES.delete('Weighted Push-Up'); BW_MOVES.add('Weighted Push-Up');
const ALL_EX=[...new Set(EXLIB.map(e=>e.n).concat(['Bodyweight','Jerk','KB Snatch','Goblet Lunge']))].sort();
