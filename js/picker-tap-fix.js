function pickOnclick(fn,name){
  return fn+'('+JSON.stringify(name).replace(/\x26/g,'\x26amp;').replace(/"/g,'\x26quot;')+')';
}
function renderPicker(){
  const raw=document.getElementById('pickSearch').value||'';
  const s=raw.toLowerCase();
  let cardioHtml='';
  if(!pickList){
    const cl=myCardio().filter(function(c){ return c.n.toLowerCase().includes(s); });
    if(cl.length){
      cardioHtml='\x3cdiv class="pickhead"\x3e\u2764\ufe0f Cardio\x3c/div\x3e'+cl.map(function(c){
        return '\x3cbutton class="pickitem" onclick="'+pickOnclick('pickCardio',c.n)+'"\x3e'+c.i+' '+c.n+'\x3cspan class="grptag"\x3etimed\x3c/span\x3e\x3c/button\x3e';
      }).join('');
    }
  }
  const list=pickerMatches(raw, pickList, pickAll);
  let html='', letter='';
  list.forEach(function(e){
    const L=e.n[0].toUpperCase();
    if(L!==letter){ letter=L; html+='\x3cdiv class="pickhead"\x3e'+L+'\x3c/div\x3e'; }
    html+='\x3cbutton class="pickitem" onclick="'+pickOnclick('pickExercise',e.n)+'"\x3e'+e.n+'\x3cspan class="grptag"\x3e'+GLABEL[e.g[0]]+'\x3c/span\x3e\x3c/button\x3e';
  });
  document.getElementById('pickList').innerHTML=cardioHtml+html||('\x3cdiv class="empty"\x3e'+pickerNoneMsg(raw, pickList, pickAll)+'\x3c/div\x3e');
}
