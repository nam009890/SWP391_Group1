import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config/appConfig.js'
import { getWeakVocabularies, startFillBlankPractice } from '../services/weakVocabularyService.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

const methods = [['FILL_BLANK', 'Điền từ theo ngữ cảnh'], ['MULTIPLE_CHOICE', 'Chọn từ đúng'], ['WORD_TO_MEANING', 'Từ → Nghĩa'], ['MEANING_TO_WORD', 'Nghĩa → Từ']]
export default function PracticeSetupPage() {
  const userId=APP_CONFIG.demoUserId; const navigate=useNavigate(); const [data,setData]=useState([]); const [type,setType]=useState(''); const [selected,setSelected]=useState([]); const [error,setError]=useState(''); const [busy,setBusy]=useState(false)
  useEffect(()=>{ getWeakVocabularies(userId).then((r)=>setData(r.items)).catch((e)=>setError(getApiErrorMessage(e,'Không thể tải từ yếu.'))) },[userId])
  const toggle=(id)=>setSelected((ids)=>ids.includes(id)?ids.filter((x)=>x!==id):[...ids,id])
  async function start(){ try { setBusy(true); const session=await startFillBlankPractice(userId,type,selected); navigate(`/weak-vocabulary/practice/${session.sessionId}`) } catch(e){setError(getApiErrorMessage(e,'Không thể tạo phiên ôn luyện.'))} finally {setBusy(false)} }
  return <section><h1>Thiết lập ôn luyện</h1>{error&&<p role="alert">{error}</p>}<h2>Phương thức</h2><div>{methods.map(([id,label])=><label key={id}><input type="radio" name="type" checked={type===id} onChange={()=>setType(id)}/>{label}</label>)}</div><h2>Chọn từ</h2>{data.map((item)=><label key={item.userVocabularyId}><input type="checkbox" checked={selected.includes(item.userVocabularyId)} onChange={()=>toggle(item.userVocabularyId)}/>{item.word} — {item.meaningVi}</label>)}<p>Đã chọn {selected.length} từ</p><button disabled={!type||!selected.length||busy} onClick={start}>Bắt đầu ôn luyện</button></section>
}
