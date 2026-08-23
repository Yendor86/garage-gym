/* Play boot: writes go to Garage Gym Play only. Do not write the live project. */
(function () {
  window.GG_STORE_READ_ONLY = false;
  window.GG_PRACTICE = false;
  window.GG_PLAY = true;
  window.GG_STORE_HOUSEHOLD = 'GYM-EHDT2C';
  window.GG_LIVE_PROJECT = 'cksnuiqpobgrdkotnrdm'; // do not write this project
  window.GG_PLAY_PROJECT = 'sqvybphogacjcqesktos';
  window.GG_PRACTICE_KEY = 'garageGymTracker_play_v1';
})();
