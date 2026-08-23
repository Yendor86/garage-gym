'use strict';
/* ================= cloud config ================= */
const SB_URL='https://sqvybphogacjcqesktos.supabase.co/rest/v1/';
const SB_KEY='sb_publishable_goW4R2ia5-t_gdngFx8tsw_ixrgHuih';
const HDR={apikey:SB_KEY, Authorization:'Bearer '+SB_KEY, 'Content-Type':'application/json'};

/* ================= exercise library ================= */
const GROUPS=['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core'];
const GLABEL={chest:'Chest',back:'Back',shoulders:'Shoulders',biceps:'Biceps',triceps:'Triceps',quads:'Quads',hamstrings:'Hamstrings',glutes:'Glutes',calves:'Calves',core:'Core'};
const QUICKS={'Push':['chest','shoulders','triceps'],'Pull':['back','biceps'],'Legs':['quads','hamstrings','glutes','calves'],'Full Body':['chest','back','shoulders','quads','hamstrings','glutes','core']};
